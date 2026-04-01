---
title: "27 seconds: what a UC metastore blip taught us about streaming resilience"
date: "April 1, 2026"
readTime: "8 min read"
excerpt: "Three streaming jobs died within 32 seconds of each other. The data plane was healthy the whole time. Here's what actually happened and what we changed."
tags: ["Databricks", "Structured Streaming", "Unity Catalog", "Delta Lake", "Incident Analysis"]
---

Saturday evening. Three streaming jobs failed within 32 seconds of each other.

No cluster issue. No bad query plan. No OOM. The compute was fine, ADLS was fine, and the Databricks status page showed all green throughout.

That last part is what made this worth writing up.

---

## What broke

These are continuous streaming jobs using `foreachBatch` -each micro-batch runs some computation and writes results back to Delta. They'd been running for hours without a problem.

Then within a 32-second window, all three fell over with the same error: `AnalysisException: DEADLINE_EXCEEDED`. A 5-second gRPC deadline being exceeded on calls to the Unity Catalog control plane.

---

## The architecture gap

Most people who run Databricks jobs don't think much about where the metadata calls go. I didn't, until this.

![Databricks control plane vs data plane](/images/databricks-control-data-plane.png)

Databricks runs as two separate planes. The **data plane** is your cloud account -the VMs, ADLS Gen2, your actual compute. The **control plane** is Databricks-hosted SaaS: Unity Catalog, the workspace API, credential vending, cluster orchestration.

When a streaming job does a Delta write, it doesn't just push bytes to cloud storage. Before writing, it calls the control plane to resolve the table, get temporary ADLS credentials, and record metadata. These are gRPC calls from the driver VM to Databricks infrastructure, with a 5-second deadline.

If that control plane is degraded for even a few seconds while a `foreachBatch` is mid-execution, the call times out, the exception propagates up, and the streaming query dies. The data plane -the thing doing the actual work -was never the problem.

This is the asymmetry that makes streaming jobs more fragile than batch jobs here. A batch job that runs for 10 minutes has a 10-minute window to hit a UC blip. A streaming job running all day generates fresh UC round-trips on every micro-batch, all day.

---

## Finding the exact moment

The `system.access.audit` table in Unity Catalog records every control plane call, its response code, and the error message. After the incident I ran:

```sql
SELECT event_time, action_name, service_name,
       response:statusCode, response:errorMessage
FROM system.access.audit
WHERE event_time BETWEEN '2026-03-28T17:14:00Z' AND '2026-03-28T17:17:00Z'
  AND service_name = 'unityCatalog'
ORDER BY event_time
```

The timeline it returned:

```
17:14:04 → 17:15:14   Dozens of UC calls, all 200. Jobs running normally.

17:15:26.749  generateTemporaryPathCredential  504  DEADLINE_EXCEEDED after 5000000000ns
17:15:26.749  getSchema                        504  DEADLINE_EXCEEDED after 5000000000ns
17:15:26.749  getSchema                        504  DEADLINE_EXCEEDED after 5000000000ns

17:15:32  job 1   → runFailed
17:15:47  job 2   → runFailed
17:15:53  generateTemporaryTableCredential  200   ← UC recovered
17:15:58  job 3   → runFailed
17:16:07  UC fully back to 200s
```

The entire UC degradation: 27 seconds. Three 504s, all at the exact same millisecond. UC recovered at 17:15:53 but job 3 still failed at 17:15:58 -the error was already in flight.

The status page showed nothing. `system.access.audit` is the ground truth here. Brief workspace-level degradations don't meet the threshold for a published incident, but they record in the audit log regardless.

---

## What was actually failing

This is where my original assumption was wrong.

I'd suspected the failures were from a `size_in_bytes()` logging call in our write utility -it calls `DeltaTable.forName().detail()` and I'd flagged it as an unnecessary UC round-trip. But the audit data showed the actual 504s were on `generateTemporaryPathCredential` and `getSchema`.

`generateTemporaryPathCredential` is how streaming jobs get ADLS write credentials for checkpoint operations. It's not optional. The streaming engine calls it automatically. You can't gate it behind a log level check or skip it with a try/except.

So the honest conclusion: application code changes can reduce UC call volume per batch, but they can't fully protect against a control plane blip. The call that actually killed these jobs lives inside the Spark/Delta machinery itself.

---

## What we changed anyway

Two things in our code were genuinely wasteful and worth fixing regardless.

### Removing size logging from the write path

We had a shared `DeltaTableAppender` utility used by 30+ streaming jobs. Its `write()` method called `DeltaTable.forName().detail()` twice per batch -before and after the write -to log table size at INFO:

```python
# Before: two UC round-trips per batch, every batch, in production
size_before = self.size_in_bytes()
logger.info("%s size before write: %sGB", self.table_name, size_before / 1e9)

df.write.format("delta").mode(mode).saveAsTable(self.table_name)

size_after = self.size_in_bytes()
logger.info("%s size after write: %sGB", self.table_name, size_after / 1e9)
```

Gating on log level instead:

```python
# After: zero UC calls at INFO (production default)
if logger.isEnabledFor(logging.DEBUG):
    size_before = self.size_in_bytes()
    logger.debug("%s size before write: %sGB", self.table_name, size_before / 1e9)
else:
    size_before = -1

df.write.format("delta").mode(mode).saveAsTable(self.table_name)

if logger.isEnabledFor(logging.DEBUG):
    size_after = self.size_in_bytes()
    logger.debug("%s size after write: %sGB", self.table_name, size_after / 1e9)
else:
    size_after = -1
```

At INFO (production default): zero extra UC calls per batch. At DEBUG (local dev or staging): telemetry comes back. We considered try/except -it still makes the network call and pays the 5-second deadline on failure. Gating on log level eliminates the call entirely.

One change in the shared utility, 30+ consumers protected without touching each one.

### Collapsing per-window spark.table() calls

A separate job was calling `spark.table()` inside a per-window loop:

```python
# Before: N UC lookups per batch
for win_start, win_end in windows:
    window_events = (
        spark.table(events_table_name)   # getSchema + tableExists + getTable
        .withColumn("eventTs", F.col("payload.sourceTs"))
        .where((F.col("eventTs") >= win_start) & (F.col("eventTs") < win_end))
        .withColumn("win", F.window("eventTs", interval))
    )
    # ... aggregation and write
```

Each `spark.table()` call triggers a `getSchema` + `tableExists` + `getTable` sequence. A 3-window batch hit UC 3 times just for table resolution before any actual data processing. This also accumulated JVM query plans across batches -the separate OOM issue we were already seeing after ~40 hours of runtime.

The fix reads the full batch range once, caches it, and filters per-window from the cached DataFrame:

```python
# After: one UC lookup per batch
global_start = min(ws for ws, _ in windows)
global_end = max(we for _, we in windows)

all_events = (
    spark.table(events_table_name)
    .withColumn("eventTs", F.col("payload.sourceTs"))
    .where((F.col("eventTs") >= global_start) & (F.col("eventTs") < global_end))
    .cache()
)
try:
    for win_start, win_end in windows:
        window_events = (
            all_events
            .where((F.col("eventTs") >= win_start) & (F.col("eventTs") < win_end))
            .withColumn("win", F.window("eventTs", interval))
        )
        # ... aggregation and write
finally:
    all_events.unpersist()
```

The `try/finally` matters. Skip it and the cached DataFrame sits in memory -you've traded a UC problem for a slow-burn memory leak.

---

## Seeing the full UC call inventory

To answer "what else is calling UC that we might not know about," this query across a full day gives the complete picture:

```sql
SELECT action_name, count(*) as call_count,
       count(CASE WHEN response:statusCode != 200 THEN 1 END) as error_count,
       collect_set(CAST(response:statusCode AS STRING)) as status_codes
FROM system.access.audit
WHERE event_time BETWEEN '<start>' AND '<end>'
  AND service_name = 'unityCatalog'
GROUP BY action_name
ORDER BY call_count DESC
```

A typical day of streaming jobs in this setup:

| action | calls/day | notes |
|--------|-----------|-------|
| getTable | 9,458 | every spark.table() call |
| metadataSnapshot | 3,352 | internal Delta file scan metadata, unavoidable |
| getSchema | 2,258 | namespace resolution |
| tableExists | 2,240 | paired with getSchema |
| generateTemporaryTableCredential | 1,159 | per write |
| generateTemporaryPathCredential | 761 | per checkpoint write |

`getTable` at 9,458/day is the number worth tracking. After the per-window spark.table() fix, it should drop measurably -batches that previously did N lookups per window now do 1 per batch. That's a concrete before/after signal if you want to validate the change actually helped.

`metadataSnapshot` at 3,352 comes from Delta's internal file scan machinery. Nothing in application code changes that.

---

## What this doesn't fix

These changes reduce UC round-trips per batch. They don't make streaming jobs immune to control plane outages.

`generateTemporaryPathCredential` -the call that actually killed these jobs -is still there. It has to be. Checkpoint writes need ADLS credentials. There's no application-level workaround.

Full protection would need retry-with-backoff inside the Spark/Delta machinery itself, which is a platform concern. The architectural alternative is `Trigger.AvailableNow` -run as managed batch with job-level retries instead of a perpetual streaming query. That trades latency for resilience, which isn't the right call for every workload.

So: we removed unnecessary overhead. Fewer calls in a degradation window means less exposure. That's the honest scope of it.

---

The thing I keep coming back to: `spark.table()` inside a loop doesn't look wrong. It works fine under normal conditions for years. The failure modes only show up during a control plane blip (blast radius) or after 40+ hours of continuous runtime (JVM heap accumulation from accumulated query plans). Neither is obvious from reading the code. The audit log query is what makes it visible -and I wouldn't have thought to run it without the incident.
