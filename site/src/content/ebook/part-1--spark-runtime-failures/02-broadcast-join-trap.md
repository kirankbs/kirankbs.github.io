---
title: "The Broadcast Join Trap"
chapter: 2
part: 1
partTitle: "Spark Runtime Failures"
status: "draft"
excerpt: "When Spark decides to broadcast a 2GB table to every executor, your job doesn't slow down — it dies. The size estimator lies about table sizes, and AQE can't always save you."
estimatedReadTime: "15 min read"
lastUpdated: "March 2026"
blogPostRef: "pyspark-ci-oom-broadcast-join"
dataset: "TPC-H (samples.tpch)"
learningObjectives:
  - "Identify the three scenarios where broadcast joins cause OOM"
  - "Configure autoBroadcastJoinThreshold correctly"
  - "Diagnose broadcast OOM from Spark UI and driver logs"
---

Coming soon.
