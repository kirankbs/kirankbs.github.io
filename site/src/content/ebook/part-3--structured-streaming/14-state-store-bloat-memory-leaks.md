---
title: "State Store Bloat and Memory Leaks"
chapter: 14
part: 3
partTitle: "Structured Streaming"
status: "draft"
excerpt: "Your streaming job runs fine for a week. Then processing time doubles per micro-batch. The state store has grown to consume all available memory, and GC can't keep up."
estimatedReadTime: "15 min read"
lastUpdated: "March 2026"
dataset: "NYC Taxi (TLC Parquet files)"
learningObjectives:
  - "Diagnose state store growth from Spark UI streaming metrics"
  - "Configure RocksDB state backend for large state"
  - "Fix DataFrame unpersist leaks in forEachBatch"
---

Coming soon.
