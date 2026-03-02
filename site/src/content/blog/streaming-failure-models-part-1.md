---
title: "Streaming Failure Models: Why \"It Didn't Crash\" Is the Worst Outcome"
date: "March 2, 2026"
readTime: "6 min read"
excerpt: "Most Databricks streaming failures don't look dramatic. No cluster termination, no red wall of errors. Just a job that says RUNNING while your customers report nonsense."
tags: ["Databricks", "Structured Streaming", "Apache Spark", "Delta Lake"]
---

*Part 1 of 3 — Multi-Query Single Job on a Shared Cluster*

---

It was 10:47pm. Laptop half-closed.

Then the message landed: *"Customer is complaining. Alerts are wrong."*

I opened the Databricks UI. Seven of eight queries: green. One: failed silently.

The job said **RUNNING**.

The customer said something different.

That gap — between what the system reports and what is actually happening — is what this series is about. Not the catastrophic failures. The quiet ones.

## The incident

We were running a multi-query continuous job on a single shared cluster. Eight streaming queries, one Python process, one Spark driver.

Yes, you could call this a bad design. And you wouldn't be wrong. But it was a conscious decision — budget-constrained infrastructure, deliberately consolidated. We knew the trade-offs. Or thought we did.

- **Query 1**: bronze ingestion — reading raw telemetry from EventHub into Delta tables
- **Queries 2–7**: structuring raw data into individual domain tables
- **Query 8**: alert resolution — resolving alerts in near real-time that were created by a separate ML job

All of them running together. All of them sharing the same driver.

---

Bronze ingestion was completely fine. But Query 8 — alert resolution — hit a `ConcurrentAppendException`. A Delta Lake conflict that fires when two writers try to commit to the same table at the same time.

What followed was worse than a crash:

- Queries 1–7 kept running
- Query 8 silently died
- For **12 minutes**, offsets stopped committing for that stream while the UI still said RUNNING
- No monitoring fired

Then came the customer messages.

## Why 12 minutes matters more than it sounds

Twelve minutes of stopped offset commits is not just a monitoring gap.

It means the system was consuming from EventHub without acknowledging it. If the job had restarted in that window: reprocessing, potential duplicates, depending on your downstream semantics.

But the job *didn't* restart. Nothing triggered a restart. The driver was alive. The other seven queries were healthy. Spark had no reason to terminate the run.

The system was wrong for 12 minutes and had no idea.

## The monitoring irony

We had monitoring. Job failure alerts, cluster termination alerts, retry notifications.

None of it fired.

Our monitoring was designed to catch *job* failures. What happened here wasn't a job failure — it was a *streaming query* failure inside a job that kept running. The job never restarted. Our alerts never triggered.

The part that still stings: the query that died silently was the one responsible for *resolving* alerts.

Here's what happened end to end: an ML signal created a CREATE alert. A downstream event should have triggered Query 8 to write a RESOLVE and close it. Query 8 was dead. The RESOLVE never came. The alert stayed open. The customer saw a false positive that should have been resolved hours earlier.

The system designed to catch problems couldn't catch its own.

## Two classes of failure — the mental model that finally clicked

After this incident, a pattern became clear. There are two fundamentally different ways a streaming job can fail.

**Query-scoped failures (driver stays alive)**

`ConcurrentAppendException`. Schema mismatch. Logic errors in `foreachBatch`. Wrong Delta path.

In these cases: one stream fails, the Spark driver JVM stays up, the other queries keep running, and the UI looks mostly healthy. This is the dangerous state — half a pipeline, half a truth.

**Driver-scoped failures (everything stops)**

Driver OOM. JVM crash. Deep scheduler corruption.

Loud. Painful. But honest. Everything stops, Databricks restarts, you get a clean slate.

The uncomfortable reality: **driver-scoped failures are easier to operate.**

A full crash is an operational problem. A partial failure is a product problem. The customer doesn't care that Queries 1–7 were fine if Query 8 was quietly dead.

## Why we didn't catch it sooner — the awaitTermination trap

Here's something Databricks doesn't shout from the rooftops: when a streaming query fails inside a multi-query job, the Spark JVM doesn't automatically know — or care — that the query is gone. The other queries keep running. The driver stays up. The job keeps running.

Our job had eight calls to `query.awaitTermination()`, one per stream, in sequence. The Python process blocks on the first one. When Query 8 failed, Python was still waiting on an earlier stream's termination. It never reached the point of checking Query 8.

From Python's perspective: blocked, waiting.
From the JVM's perspective: everything is fine.
From the UI's perspective: RUNNING.
From the customer's perspective: something is very wrong.

Worth noting: Databricks documentation doesn't recommend either `awaitTermination` or `awaitAnyTermination` for production — they want you to rely on job-level management instead. But in our case, we needed the Python process to exit to trigger a JVM failure, which Databricks would then restart.

## "But continuous jobs restart automatically"

They do — eventually. Continuous jobs retry with backoff and trigger a new run after exhausting retries.

The catch: for that to happen, the **Spark JVM has to actually fail first**. With `query.awaitTermination()` on each stream individually, the Python process never exited. Spark never failed. Databricks never restarted.

The job just sat there. RUNNING. Wrong.

## The fix — and why it's a band-aid

Once we understood the failure chain, the fix was one line.

Replace individual `query.awaitTermination()` calls with:

```python
spark.streams.awaitAnyTermination()
```

Now, if *any* stream fails, the Python process exits. Python exits → Spark JVM dies → Databricks detects the failure → 3 retries → new run. Proper failure semantics, clean restart, no more silent death.

Did it work? Yes. Is it a proper solution? No.

But who has time for a proper solution when production is on fire?

`awaitAnyTermination` gave us fail-fast behaviour while we worked on the actual fix. It stopped the lying. It didn't fix the underlying architecture.

The underlying architecture — why running eight streaming queries in one job on a shared cluster creates these failure modes in the first place, and what we did about it — is what Part 2 is about.

**→ Part 2: Multi-Task on a Shared Cluster — Why That's Also Not Enough**
