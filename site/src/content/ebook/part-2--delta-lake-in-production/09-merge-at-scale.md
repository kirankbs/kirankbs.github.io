---
title: "MERGE at Scale: Concurrency, Performance, and Correctness"
chapter: 9
part: 2
partTitle: "Delta Lake in Production"
status: "published"
free: true
excerpt: "Your MERGE runs fine on 10M rows. At 1B rows, it rewrites half the table. Add concurrent writers and you get ConcurrentAppendException. The fix is partition pruning."
estimatedReadTime: "10 min read"
lastUpdated: "March 2026"
blogPostRef: "delta-concurrent-append-exception"
dataset: "NYC Taxi (samples.nyctaxi.trips)"
learningObjectives:
  - "Add partition columns to MERGE ON for 10x speedup"
  - "Handle ConcurrentAppendException without retry loops"
  - "Understand Low-Shuffle MERGE and Deletion Vectors impact"
---

> **What you'll learn:** Why MERGE performance degrades non-linearly on large tables, and the configuration change that fixes it.

---

## The incident that started this chapter

The MERGE had been running for four hours.

It was a straightforward upsert. 35 million rows from a staging table into a fact table with a few billion records. Textbook CDC pattern. Worked fine in dev, where the fact table had 50 million rows. In production, the numbers were different.

The cluster was an `i3.2xlarge` with 8 workers. Photon enabled. Low-Shuffle MERGE turned on. Z-ORDER applied on the join key. Every optimization the Databricks docs recommended. And still, four hours. Sometimes six. Sometimes it timed out entirely and the retry kicked in, adding another four hours.

The Spark UI told the story. A single stage was reading every Parquet file in the target table. Not just the partitions containing matching rows, *every* file. Billions of rows scanned to find 35 million matches.

![Spark UI Scan stage showing all files read — no partition pruning active](/images/ebook/ch09-spark-ui-before-pruning.png)
*Spark UI → SQL tab → Scan node. "Files read" equals the total file count in the table. No partition filters applied.*

The fix took ten minutes. Two extra columns in the `MERGE ON` clause. Run time dropped from four hours to twenty minutes.

That's what this chapter is about.

---

## How MERGE actually works

MERGE is not an in-place update. Delta Lake is an append-only storage format, so there's no "modify row 47 in file 3." What actually happens is a copy-on-write cycle:

1. **Find matching files.** Scan the target table for files that contain rows matching the join condition. This is the expensive part.
2. **Read matched files entirely.** Even if only one row in a Parquet file matches, the entire file gets read.
3. **Apply the merge logic.** Join the source and target data, apply WHEN MATCHED / WHEN NOT MATCHED rules.
4. **Write new files.** Rewrite the affected data as new Parquet files with the changes applied.
5. **Commit to the transaction log.** Add the new files and mark the old ones as removed in `_delta_log`.

Step 1 is where most teams lose hours without realizing it. If Delta Lake can't narrow down which files to scan, it reads the entire table. Your 35-million-row update touches a 10-billion-row table end to end.

This is copy-on-write at its most punishing. A MERGE that matches 0.3% of your table can rewrite 30% of it if matching rows are scattered across many files.

---

## Partition pruning: the lever that actually matters

The most impactful thing you can do for MERGE performance isn't a configuration flag or a cluster resize. It's adding your partition columns to the `MERGE ON` clause.

Here's the typical pattern:

```sql
MERGE INTO fact_table AS target
USING staging AS source
ON target.id = source.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
```

Looks clean. Runs forever at scale.

Delta Lake sees a join on `id`, a high-cardinality column. It has no way to know which partitions contain matching IDs without scanning the entire table. Every Parquet file gets read.

Now add the partition columns:

```sql
MERGE INTO fact_table AS target
USING staging AS source
ON target.id = source.id
  AND target.year = source.year
  AND target.month = source.month
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *
```

Same logic, same results, completely different execution plan.

With `year` and `month` in the ON clause, Delta Lake can prune partitions before the scan starts. If your staging data spans three months, only those three partitions get read. Instead of scanning billions of rows across the full table, you scan tens of millions across three directories.

In the incident I opened with, this dropped MERGE time from four-plus hours to under twenty minutes. The Confessions of a Data Guy blog documented the same pattern at similar scale, reporting a 36x improvement from the same fix.

### Why the optimizer can't do this for you

If partition pruning matters this much, why doesn't the query optimizer figure it out?

It can't. The optimizer doesn't know that every `id` in your staging table falls within a predictable range of `year` and `month` values. That's domain knowledge. You know your CDC batches contain yesterday's data. You know your staging table maps cleanly to a time-bounded set of partitions. The optimizer sees two tables and a join condition, nothing more.

This is one of the few remaining places where the human matters more than the engine.

> **Production note:** This applies to Hive-style partitioned tables. For Liquid Clustered tables, the equivalent is including clustering key columns in the MERGE condition so data skipping (via file-level min/max stats) can eliminate files. Different mechanism, same principle: give the engine enough information to skip files.

---

## ConcurrentAppendException: when two writers collide

Partition pruning makes MERGE fast. But fast isn't safe if two jobs try to MERGE into the same table at the same time.

Delta Lake uses optimistic concurrency control. Each writer reads a snapshot of the table, does its work, then tries to commit. If another writer committed first, Delta Lake checks whether the two commits conflict. If they touched the same files, the second writer gets a `ConcurrentAppendException`:

```
io.delta.exceptions.ConcurrentAppendException:
Files were added to partition [year=2026, month=3]
by a concurrent update. Please try the operation again.
```

The name is misleading. It fires on any concurrent modification that touches overlapping partitions, not just appends. Two MERGEs targeting the same date range. A MERGE running alongside an OPTIMIZE. A streaming job and a batch upsert writing to the same table.

### When it fires and when it doesn't

Delta Lake's conflict detection is partition-aware. Two concurrent writes to *different* partitions succeed. Two writes to the *same* partition conflict.

This is why partition pruning matters for concurrency, not just performance. A MERGE without partition columns in the ON clause touches "all partitions" from Delta Lake's perspective. Any concurrent write to the table will conflict with it, even if the actual matching rows don't overlap at all.

Add partition columns to your MERGE condition and you limit the conflict surface to just the partitions you actually touch. Two concurrent MERGEs to different months succeed without conflict.

> **Warning:** Early versions of Delta Lake (pre-1.0) were overly conservative — even writes to non-overlapping partitions could conflict if the conflict detection couldn't prove they were disjoint. This was tracked in [delta-io/delta#9](https://github.com/delta-io/delta/issues/9). Modern Delta Lake handles this correctly, but if you're on an old open-source version, be aware.

### Handling the exception

There's no built-in retry. The delta-io/delta community [requested one in 2020](https://github.com/delta-io/delta/issues/445) and it was never implemented. You need application-level retry logic.

The tricky part is that retrying a MERGE isn't cheap. The table snapshot has changed since the first attempt. The retry has to re-read the target, re-join, re-write. It's a full re-execution, not a "re-apply the diff."

Here's a retry pattern that's served me well:

```python
from delta.exceptions import ConcurrentAppendException
import time

def merge_with_retry(spark, merge_sql, max_retries=3):
    for attempt in range(max_retries):
        try:
            spark.sql(merge_sql)
            return
        except ConcurrentAppendException:
            if attempt == max_retries - 1:
                raise
            wait = (2 ** attempt) + 1  # 2s, 5s, 9s
            print(f"ConcurrentAppendException on attempt {attempt + 1}, "
                  f"retrying in {wait}s...")
            time.sleep(wait)
```

Exponential backoff matters. If two writers collide, you don't want them both retrying instantly and colliding again. Stagger the retries and the second attempt usually succeeds.

> **Production note:** If you're hitting ConcurrentAppendException regularly, the retry loop is a band-aid. The real fix is either serializing writes through an orchestrator, writing to separate tables and reconciling later, or redesigning your partitioning so concurrent writers naturally target different partitions. The partitioning approach is usually the right one.

---

## Non-deterministic MERGE: the correctness trap

Performance and concurrency get the attention. But there's a correctness problem that's harder to spot: non-deterministic MERGE results.

The Delta Lake documentation buries this requirement: **the MERGE condition must match each target row to at most one source row.** If a source row matches multiple target rows, or a target row matches multiple source rows, the MERGE becomes non-deterministic. You get duplicates, silent data loss, or different results on different runs.

```sql
-- This is dangerous if source has duplicate IDs
MERGE INTO target
USING source
ON target.id = source.id
WHEN MATCHED THEN UPDATE SET target.value = source.value
WHEN NOT MATCHED THEN INSERT *
```

If `source` has two rows with `id = 42`, which value wins? Spark picks one, but which one depends on the physical layout of the data: partition ordering, file placement, shuffle behavior. Run it twice and you might get different results.

### How to protect yourself

**Deduplicate your source before MERGE.** Always. Even if you "know" the source doesn't have duplicates. CDC sources replay events. Kafka topics duplicate on failover. Staging queries accidentally fan out from a bad join. Duplicates sneak in.

```python
from pyspark.sql import Window
from pyspark.sql.functions import row_number, col

window = Window.partitionBy("id").orderBy(col("event_time").desc())
deduped_source = (
    source
    .withColumn("_rn", row_number().over(window))
    .filter("_rn = 1")
    .drop("_rn")
)
```

Take the latest record per key. Then MERGE.

This is cheap compared to the debugging session you'll have when a customer asks why their account balance changed between two identical pipeline runs.

---

## Low-Shuffle MERGE

Databricks introduced Low-Shuffle MERGE to reduce the data rewriting cost. Instead of rewriting entire files that contain matched rows, Low-Shuffle MERGE writes only the changed rows to new files and leaves unchanged rows in their existing files.

Enable it with:

```sql
SET spark.databricks.delta.merge.lowShuffle.enabled = true;
```

On Databricks Runtime 12.x+, it's enabled by default.

### What it actually changes

In classic MERGE, if a Parquet file has 100,000 rows and one row matches, all 100,000 rows get rewritten. Low-Shuffle MERGE writes only the one changed row to a new file and creates a small metadata marker (a Deletion Vector) in the original file indicating the old row is invalidated.

Where you'll see the biggest win is when your match rate is low (few rows updated per file) and your files are large (OPTIMIZE has compacted them to ~1GB). In that scenario, classic MERGE is rewriting huge files for tiny changes, and Low-Shuffle skips the rewrite entirely.

It makes less difference for high match rates or bulk loads where most of the table changes anyway.

### The catch

Low-Shuffle MERGE creates more files. Instead of one rewritten file replacing the original, you now have the original file (with a Deletion Vector) plus a small new file containing the updated row. Over many MERGE cycles, this accumulates. The same file gains multiple Deletion Vectors, small files pile up.

Predictive Optimization or scheduled OPTIMIZE handles this eventually. But if you run MERGEs frequently (streaming micro-batch into a Delta table every few minutes), the small files accumulate faster than OPTIMIZE cleans them up. Monitor your file counts. Chapter 6 covers this in depth.

---

## Deletion Vectors: the hidden cost

Deletion Vectors (DVs) are the mechanism behind Low-Shuffle MERGE and `DELETE` operations on modern Delta Lake. Instead of rewriting a Parquet file to remove rows, Delta Lake writes a bitmap (the Deletion Vector) alongside the file, marking which row indices are logically deleted.

Reads see the DV and skip the marked rows. Writes don't need to rewrite the whole file. It's a net win for write-heavy workloads.

But DVs have costs.

Every read has to check the DV bitmap for every file that has one. Across hundreds of files, the I/O and CPU for loading and applying these bitmaps adds up. I've seen 5-15% read regression on DV-heavy tables, depending on the ratio of deleted to live rows.

There's also storage fragmentation. After many MERGE/DELETE cycles, you end up with files where 30-40% of rows are DV-marked as deleted. The file is 1GB on disk but only 600MB of live data. You're paying for storage and scan time on dead rows.

OPTIMIZE clears this up by rewriting files and dropping their Deletion Vectors. But if OPTIMIZE runs while a MERGE is in progress, you get `ConcurrentAppendException`. Back to the retry loop.

> **2026 update:** Delta Lake 3.2+ introduced improvements to DV storage efficiency, and Databricks Runtime 15.4+ includes automatic DV compaction during OPTIMIZE. If you're on older versions, DV accumulation is a bigger problem. On current versions, it's manageable as long as OPTIMIZE runs regularly — which Predictive Optimization handles for managed tables.

---

## Try it yourself

```python
# ============================================================
# Chapter 9: MERGE at Scale — Partition Pruning Impact
# Dataset: NYC Taxi (samples.nyctaxi.trips)
# What this shows: MERGE speedup from adding partition columns
#   to the ON clause
# Run this in: Databricks notebook with access to samples catalog
# ============================================================

from pyspark.sql.functions import (
    col, lit, current_timestamp, date_format, expr
)
import time

# -----------------------------------------------------------
# Step 1: Create a partitioned Delta table from NYC Taxi data
# -----------------------------------------------------------
source_df = spark.table("samples.nyctaxi.trips")

taxi = (
    source_df
    .withColumn("trip_year",
                date_format("tpep_pickup_datetime", "yyyy"))
    .withColumn("trip_month",
                date_format("tpep_pickup_datetime", "MM"))
)

taxi.write.format("delta") \
    .mode("overwrite") \
    .partitionBy("trip_year", "trip_month") \
    .saveAsTable("sandbox.ebook_ch09.taxi_trips")

print(f"Target table rows: {spark.table('sandbox.ebook_ch09.taxi_trips').count():,}")

# -----------------------------------------------------------
# Step 2: Create a staging batch (simulate CDC for one month)
# -----------------------------------------------------------
staging = (
    spark.table("sandbox.ebook_ch09.taxi_trips")
    .filter("trip_year = '2016' AND trip_month = '01'")
    .limit(500_000)
    .withColumn("fare_amount", col("fare_amount") + lit(1.0))
    .withColumn("updated_at", current_timestamp())
)

staging.createOrReplaceTempView("staging_batch")
print(f"Staging batch rows: {staging.count():,}")

# -----------------------------------------------------------
# Step 3: MERGE without partition pruning (slow path)
# -----------------------------------------------------------
merge_slow = """
MERGE INTO sandbox.ebook_ch09.taxi_trips AS target
USING staging_batch AS source
ON target.tpep_pickup_datetime = source.tpep_pickup_datetime
   AND target.tpep_dropoff_datetime = source.tpep_dropoff_datetime
   AND target.pickup_zip = source.pickup_zip
WHEN MATCHED THEN
  UPDATE SET target.fare_amount = source.fare_amount
"""

start = time.time()
spark.sql(merge_slow)
slow_time = time.time() - start
print(f"MERGE without partition pruning: {slow_time:.1f}s")

# -----------------------------------------------------------
# Step 4: Reset the table, then MERGE with partition pruning
# -----------------------------------------------------------
# Recreate the table to get a clean state
taxi.write.format("delta") \
    .mode("overwrite") \
    .partitionBy("trip_year", "trip_month") \
    .saveAsTable("sandbox.ebook_ch09.taxi_trips")

merge_fast = """
MERGE INTO sandbox.ebook_ch09.taxi_trips AS target
USING staging_batch AS source
ON target.tpep_pickup_datetime = source.tpep_pickup_datetime
   AND target.tpep_dropoff_datetime = source.tpep_dropoff_datetime
   AND target.pickup_zip = source.pickup_zip
   AND target.trip_year = source.trip_year
   AND target.trip_month = source.trip_month
WHEN MATCHED THEN
  UPDATE SET target.fare_amount = source.fare_amount
"""

start = time.time()
spark.sql(merge_fast)
fast_time = time.time() - start
print(f"MERGE with partition pruning: {fast_time:.1f}s")
print(f"Speedup: {slow_time / fast_time:.1f}x")
```

Run both and compare. The Spark UI tells the full story — look at the "files read" metric in the Scan node. Without partition pruning, it reads every file. With it, only the files in `trip_year=2016/trip_month=01`.

![Spark UI Scan stage after partition pruning — only files in the target partition read](/images/ebook/ch09-spark-ui-after-pruning.png)
*Same query, partition columns added to ON clause. "Files read" drops to just the matched partitions. PartitionFilters visible in the physical plan.*

On the NYC Taxi dataset (small by production standards), you'll see a clear difference. At billions of rows the gap widens considerably. 10x is common, 30x+ is documented at large scale.

---

## Diagnosing slow MERGE: what to check in the Spark UI

When a MERGE is slow, the Spark UI gives you everything you need. You just have to know where to look.

**1. Check the Scan stage.** Open the SQL tab, find the MERGE query, and look at the first Scan node. The key metrics:
- **Files read:** If this equals the total number of files in the table, you have no pruning. The MERGE is scanning everything.
- **Rows read vs. rows matched:** If you're reading 10 billion rows to match 1 million, your pruning is broken.
- **Partitions pruned:** Look for "partition filters" in the physical plan. `PartitionCount: 3 (pruned 97)` means it's working. No mention of pruning means it isn't.

**2. Check the Write stage.** Look at bytes written vs. bytes read:
- If bytes written ≈ bytes read, you're rewriting most of what you scanned. Classic MERGE behavior.
- If bytes written << bytes read, Low-Shuffle MERGE is working — only changed rows are written.

**3. Check for spill.** If the MERGE stage spills to disk, the join is either too large for executor memory or you have skew in the join key. Spill won't kill the job, but expect a 3-5x slowdown.

**4. Run EXPLAIN.** Before executing the MERGE, run the same query with `EXPLAIN FORMATTED`:

```sql
EXPLAIN FORMATTED
MERGE INTO fact_table AS target
USING staging AS source
ON target.id = source.id
  AND target.year = source.year
WHEN MATCHED THEN UPDATE SET *
```

Look for `PartitionFilters` in the output. If they're there, partition pruning is active. If not, your ON clause doesn't include partition columns.

---

## MERGE and streaming: a special kind of pain

Streaming `foreachBatch` with MERGE is a common pattern for upserts:

```python
def upsert_to_delta(batch_df, batch_id):
    batch_df.createOrReplaceTempView("updates")
    spark.sql("""
        MERGE INTO target_table AS t
        USING updates AS u
        ON t.id = u.id
        WHEN MATCHED THEN UPDATE SET *
        WHEN NOT MATCHED THEN INSERT *
    """)

stream.writeStream \
    .foreachBatch(upsert_to_delta) \
    .option("checkpointLocation", "/checkpoints/upsert") \
    .start()
```

This works, but introduces two problems:

**Micro-batch contention.** If your trigger interval is short (10 seconds) and the MERGE takes 30 seconds, batches queue up. The next micro-batch waits for the previous MERGE to commit. Latency grows. If you have multiple streams targeting the same table, you'll hit `ConcurrentAppendException` on every other batch.

**No AQE on the first batch.** AQE uses runtime statistics from previous stages. The first micro-batch of a streaming query has no prior stats. AQE's skew handling and partition coalescing don't activate until the second batch. If your first batch is large (reprocessing after a restart), it runs without AQE's protections.

The fix for contention is structural: don't have multiple streams MERGE into the same table. Route them through separate staging tables and run a single batch MERGE on a schedule. Less elegant, far more reliable.

---

## Diagnostic checklist

1. **Symptom**: MERGE takes hours on a table that should take minutes
   **Check**: Spark UI → Scan stage → files read. Is it the full table?
   **Fix**: Add partition columns to the `MERGE ON` clause.

2. **Symptom**: `ConcurrentAppendException` on every other run
   **Check**: Are multiple jobs writing to the same table at the same time?
   **Fix**: Serialize writes, partition-isolate concurrent writers, or add retry with exponential backoff.

3. **Symptom**: MERGE produces duplicate rows
   **Check**: Does your source have duplicate keys? Does the ON clause uniquely match source-to-target?
   **Fix**: Deduplicate source before MERGE. Use `row_number()` with a deterministic ordering.

4. **Symptom**: File count grows after every MERGE
   **Check**: Is Low-Shuffle MERGE enabled? Are Deletion Vectors accumulating?
   **Fix**: Schedule OPTIMIZE after MERGE cycles, or rely on Predictive Optimization for managed tables.

5. **Symptom**: MERGE stage spills to disk
   **Check**: Executor memory vs. partition size. Is one partition orders of magnitude larger than others?
   **Fix**: Repartition source data, or increase executor memory. Check if AQE skew handling is active (`spark.sql.adaptive.skewJoin.enabled`).

6. **Symptom**: Streaming MERGE latency increases over time
   **Check**: Are micro-batches queuing? Is each MERGE slower than the trigger interval?
   **Fix**: Increase trigger interval, reduce MERGE scope with partition pruning, or switch to batch MERGE on a schedule.

---

## What I'd do differently

If I were building the CDC pipeline from the incident again:

I'd partition the fact table on a time column from day one, something I should have done regardless of MERGE. Partition design is a table-creation decision that's painful to change later.

I'd skip the retry loop for ConcurrentAppendException. Instead, I'd design the pipeline so that concurrent writes target different partitions. If two jobs need to write to the same table, they'd write to separate staging tables and a single coordinator job would do the MERGE. One writer per table per time window. Simple.

I'd deduplicate my source unconditionally. Even when I "know" the source is clean. The dedup adds seconds; the debugging session when it's not clean costs hours.

And I'd check partition pruning in `EXPLAIN` before the first production run. Not after four hours of waiting. Before.

---

## Key takeaways

- **Add partition columns to the MERGE ON clause.** The difference between scanning the full table and scanning three partitions is the difference between hours and minutes. The optimizer cannot infer this. You have to provide it.

- **ConcurrentAppendException means overlapping partitions, not overlapping rows.** Two MERGEs to different partitions succeed concurrently. Two MERGEs that touch the same partition conflict. Partition pruning in the MERGE condition reduces the conflict surface.

- **Deduplicate your source before MERGE, every time.** A non-unique join condition produces non-deterministic results. This is a correctness bug, not a performance issue.

- **Low-Shuffle MERGE reduces write amplification but increases file count.** Monitor Deletion Vector accumulation. OPTIMIZE cleans it up, but you need to run it (or trust Predictive Optimization to schedule it).

- **Streaming MERGE via foreachBatch has contention issues at short trigger intervals.** If your MERGE takes longer than your trigger interval, batches queue and latency grows. Consider batch MERGE on a schedule instead of streaming MERGE every micro-batch.
