---
title: "Multi-Task on a Shared Cluster — Why That's Also Not Enough"
date: "March 5, 2026"
readTime: "6 min read"
excerpt: "Splitting into multiple tasks feels like the obvious fix after a multi-query partial failure. It isn't — not on a shared cluster. There's still one driver."
tags: ["Databricks", "Structured Streaming", "Apache Spark", "Delta Lake"]
---

*Part 2 of 3 — Databricks Streaming Architecture*

---

The instinct after Part 1 was obvious.

If running eight queries in one task means one failure can hide while others keep running — split them into multiple tasks. Separate concerns. Give each component its own retry boundary.

Right instinct. Wrong infrastructure assumption.

## We tried it

While the multi-query incident from Part 1 was still fresh, we were already experimenting with a multi-task approach on a separate workflow. Two tasks, same shared job cluster:

- **Task 1**: feature extraction — processing sensor data into feature tables
- **Task 2**: inference — ML model outputs written to downstream Delta tables

Sequential dependency. Task 2 reads what Task 1 writes. Clean separation on paper.

Then Task 2 hit a wall.

## The incident — external location mismatch

Task 2 was writing to a Delta table registered in Unity Catalog. The catalog entry pointed to external location A. The actual data sat at location B.

A misconfiguration. Easy to make during migration, hard to spot before it fails in production.

Task 2 failed. Task 1 kept running.

And here's where it felt familiar: the job didn't fail. No restart triggered. One task retrying. The other healthy. The UI said RUNNING.

Same story as Part 1. Different packaging.

## The detail that changes everything: there's still one driver

Here's what multi-task on a shared cluster actually looks like at runtime:

```
Multi-Task on a Shared Job Cluster

Task 1 (Python Process A)     Task 2 (Python Process B)
          \                           /
           \                         /
            ┌────────────────────────┐
            │      Spark Driver      │
            │         JVM            │
            │    (shared by all)     │
            └────────────────────────┘
                       │
                  Executors
```

Multiple Python processes. One Spark driver JVM.

Compare that to multi-query single task from Part 1:

```
Multi-Query Single Task

     Python Process (single)
              │
     ┌────────────────────┐
     │    Spark Driver    │
     │        JVM         │
     │  Q1  Q2  Q3 ... Q8 │
     └────────────────────┘
              │
         Executors
```

The difference between these two diagrams is smaller than it looks. Both share the same driver. Both share the same executors. Multi-task adds Python process separation — but that's not where streaming failures originate. Streaming failures live in the JVM, in the query scheduler, in the Delta transaction layer. All of which is still shared.

## What multi-task actually adds on a shared cluster

Splitting into tasks on a shared cluster gives you:

- Multiple Python processes on the same driver node
- Multiple SparkSession lifecycles, each with its own initialisation overhead
- More listeners, more logging, more scheduler registration
- Concurrent memory pressure when tasks run in parallel
- A failing task retrying repeatedly can destabilise the cluster for every other task

You get the operational complexity of multiple processes without the isolation you were looking for.

## The fix — and why it works here

For the external location incident, we added task-level retry configuration: three retries per task on the continuous job. Once exhausted, Databricks restarts the entire job.

It works. And it's a better failure story than Part 1 — Task 2 eventually fails loudly and triggers a restart rather than running silently while Task 1 keeps writing data nobody will ever resolve.

But here's the key distinction: **it works because Task 1 and Task 2 are sequential.** Task 2 depends on Task 1. They don't run simultaneously. No concurrent driver contention. Failure propagates cleanly up the chain.

Multi-task on a shared cluster is a reasonable pattern for sequential batch ETL. Feature extraction feeds inference. Inference feeds output. Tasks chain, failures surface, retries make sense.

The problem is assuming the same pattern works for parallel long-running streaming. That's where the shared driver becomes a liability instead of a trade-off.

## The rule we wrote down

After both incidents, this became our working principle:

> Multi-task on a shared cluster: right for sequential batch ETL, wrong for parallel streaming.

The difference is contention. Sequential tasks don't compete for the driver simultaneously. Parallel streaming queries do — continuously, for the lifetime of the job.

If you're running parallel streaming on a shared cluster, a multi-query single task with `awaitAnyTermination` (Part 1) gives you a cleaner failure boundary than splitting into tasks.

If you're running sequential batch ETL, multi-task with task-level retry is a legitimate approach within the budget constraints of a shared cluster.

## But this still isn't the real answer

Both fixes share the same problem.

`awaitAnyTermination` in Part 1 makes query failures loud. Task retry in Part 2 makes task failures recoverable. Neither prevents a failure in one component from affecting the shared driver — and everything attached to it.

The real answer is what we'd resisted for months: one cluster per task. A failure in the inference pipeline that cannot, by construction, affect the ingestion pipeline.

That's Part 3 — when we made the architectural change, what it cost, and what got better overnight.

**→ Part 3: One Cluster per Task — What Real Isolation Actually Looks Like**
