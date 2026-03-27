---
title: "Introduction"
chapter: 0
status: "published"
free: true
excerpt: "The landscape has changed. AQE, Liquid Clustering, Predictive Optimization, and Serverless have automated much of what we used to do manually. This book focuses on what's left — the problems these features don't solve."
estimatedReadTime: "6 min read"
lastUpdated: "March 2026"
---

## The advice that used to be right

Three years ago, every Spark optimization guide told you the same things:

- Set `spark.sql.shuffle.partitions` to match your data size
- Manually broadcast small tables for join performance
- Salt your keys to handle data skew
- Schedule OPTIMIZE and VACUUM as cron jobs
- Use Hive-style partitioning and tune your partition columns carefully
- Switch to G1GC and tune your GC parameters
- Use `repartition()` before writes to control output file sizes

This was all good advice. It was also a lot of manual work that required deep knowledge of Spark internals.

Then the platform caught up.

## What's automated now

Adaptive Query Execution (AQE), enabled by default since Spark 3.2, handles most of the manual tuning that used to fill blog posts and conference talks:

- **Shuffle partitions** — AQE coalesces partitions at runtime based on actual data sizes. Setting a magic number is no longer necessary.
- **Broadcast joins** — AQE converts sort-merge joins to broadcast hash joins at runtime when it detects a small table. Manual broadcast hints are rarely needed.
- **Skew handling** — AQE detects skewed partitions (greater than 5x median AND greater than 256MB) and splits them automatically.

Liquid Clustering (GA in 2024-2025) replaced both Hive-style partitioning and Z-ORDER for most use cases. Clustering keys can be changed without full table rewrites. Incremental clustering processes only new data.

Predictive Optimization (default for new Databricks accounts since November 2024) automates OPTIMIZE, VACUUM, and statistics collection. No more cron jobs.

Photon eliminates JVM garbage collection for query execution entirely. Serverless compute eliminates cluster sizing, autoscaling tuning, and idle cost management.

These are real improvements. A lot of operational pain has genuinely been automated away.

## So what's left?

This book.

The problems in these chapters are the ones that AQE, Liquid Clustering, Photon, and Serverless *don't* solve. The edge cases. The failure modes that only appear at scale. The architectural decisions that compound over months until they become emergencies.

A few examples of what's still very much your problem:

- **AQE's skew detection has thresholds.** If your skewed partition is 200MB instead of 256MB, AQE won't split it. In streaming, AQE's runtime statistics aren't available for the first micro-batch. Skew in streaming is still a manual fight.

- **Liquid Clustering is UC-only and incompatible with streaming writes.** If you `CREATE OR REPLACE` a table without including `CLUSTER BY`, clustering silently disappears. Predictive Optimization sometimes picks the wrong clustering keys for your query patterns.

- **VACUUM still breaks streaming consumers.** The retention-streaming-time-travel triangle has no automatic solution. Someone on your team will run `VACUUM RETAIN 0 HOURS` and break every concurrent reader. This is a people problem as much as a technology problem.

- **MERGE performance degrades non-linearly at scale.** Low-Shuffle MERGE and Deletion Vectors help, but the number one performance lever is still adding partition columns to your `MERGE ON` clause — something the optimizer can't do for you because it requires domain knowledge.

- **DBR upgrades break library dependencies.** DBR 15.4 changed the default working directory. DBR 16 switched to JDK 17. DBR 17 introduced vLLM dependency conflicts. No automation prevents these breaks — you need a testing strategy.

- **Notebook monoliths with hidden state are still the default for most teams.** Serverless doesn't fix your code organization. Unity Catalog doesn't fix your secret management. Predictive Optimization doesn't fix your medallion architecture when Bronze has no retention policy and Silver is just renamed Bronze.

## The five parts

This book is organized around the layers of the stack where things break:

**Part I: Spark Runtime Failures** — OOM errors, broadcast join traps, shuffle/skew after AQE, dynamic allocation on K8s and Serverless, UDF performance. The runtime problems that surface as crashed jobs, hung stages, or mysteriously slow queries.

**Part II: Delta Lake in Production** — Small files, Liquid Clustering gotchas, VACUUM breaking downstream, MERGE at scale, schema evolution surprises, CDF/time travel/Deletion Vector costs. The storage layer problems that surface as slow queries, failed reads, or unexpected bills.

**Part III: Structured Streaming** — Checkpoint fragility, watermark tradeoffs, state store bloat, exactly-once guarantees, streaming on serverless. The streaming problems that surface as data loss, increasing latency, or pipelines that look healthy but aren't.

**Part IV: Databricks Platform Pitfalls** — Cluster economics, DBR version upgrades, Unity Catalog migration, notebook-to-production transition. The platform problems that surface as cost overruns, broken deployments, or governance gaps.

**Part V: Architecture Mistakes** — Medallion anti-patterns, over-partitioning, namespace design, cost optimization decisions. The architectural problems that surface months after the decision was made, when fixing them requires a migration project.

## How to use the examples

Every chapter includes at least one runnable example using public datasets. Most use the NYC Taxi dataset (available as `samples.nyctaxi.trips` in any Databricks workspace, or as downloadable Parquet from the TLC website). Some use TPC-H or TPC-DS for join-heavy scenarios. A few use small Databricks sample datasets when the concept matters more than the data size.

The examples are designed to be self-sufficient. Copy the code block. Paste it into a Databricks notebook or a local PySpark session. Run it. See the problem happen. Then apply the fix and see the difference.

For chapters where Databricks isn't required, examples work with local Spark:

```python
from pyspark.sql import SparkSession
spark = SparkSession.builder \
    .master("local[*]") \
    .config("spark.driver.memory", "4g") \
    .getOrCreate()
```

For Databricks-specific chapters, the examples assume a workspace with access to the `samples` catalog — which every Databricks workspace has by default.

All example notebooks are available for download in the `examples/` directory of this book's repository.

## A note on versions

This book targets the 2025-2026 stack: Spark 3.5+, Delta Lake 3.x/4.x, Databricks Runtime 15.4 LTS through 17.x. Where behavior changed between versions, the chapter calls it out explicitly.

I'll update chapters as new DBR versions land and new features change the landscape. The early access format makes this possible — this is a living document, not a snapshot.

Let's get started.
