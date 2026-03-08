---
title: "UDF Performance Traps and Serialization"
chapter: 5
part: 1
partTitle: "Spark Runtime Failures"
status: "draft"
excerpt: "Python UDFs are 10-100x slower than native Spark functions. Non-serializable closures crash at runtime. WholeStageCodegen silently disables above 100 columns."
estimatedReadTime: "14 min read"
lastUpdated: "March 2026"
dataset: "Diamonds (databricks-datasets)"
learningObjectives:
  - "Replace Python UDFs with Pandas UDFs or Arrow-optimized functions"
  - "Debug NotSerializableException in production"
  - "Understand WholeStageCodegen limits"
---

Coming soon.
