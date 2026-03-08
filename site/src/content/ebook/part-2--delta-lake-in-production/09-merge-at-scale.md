---
title: "MERGE at Scale: Concurrency, Performance, and Correctness"
chapter: 9
part: 2
partTitle: "Delta Lake in Production"
status: "draft"
excerpt: "Your MERGE runs fine on 10M rows. At 1B rows, it rewrites half the table. Add concurrent writers and you get ConcurrentAppendException. The fix is partition pruning."
estimatedReadTime: "20 min read"
lastUpdated: "March 2026"
blogPostRef: "delta-concurrent-append-exception"
dataset: "NYC Taxi (samples.nyctaxi.trips)"
learningObjectives:
  - "Add partition columns to MERGE ON for 10x speedup"
  - "Handle ConcurrentAppendException without retry loops"
  - "Understand Low-Shuffle MERGE and Deletion Vectors impact"
---

Coming soon.
