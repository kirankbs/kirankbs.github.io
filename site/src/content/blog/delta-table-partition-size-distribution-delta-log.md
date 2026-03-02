---
title: "Understanding Delta Table Partition Size Distribution Using the Delta Log"
date: "February 16, 2026"
readTime: "5 min read"
excerpt: "Learn how to inspect the Delta transaction log to understand your partition size distribution and make informed partitioning decisions."
tags: ["Delta Lake", "Databricks", "Partitioning", "Performance"]
---

When managing externally controlled Delta tables with traditional partitioning approaches (by day, week, or month), a key question arises: "How large are my partitions actually?" Understanding data distribution across partitions proves essential before selecting an appropriate partitioning granularity.

## Why Examine the Delta Log?

Delta tables maintain a `_delta_log` directory housing JSON transaction records. Each `add` action contains:

- File location path
- File size measured in bytes
- Associated partition values

This data enables calculation of:

- File count per partition
- Total bytes per partition
- Size variance distribution across partitions

This reveals the underlying physical structure of your table.

## Computing Partition Sizes by startDate

```python
from pyspark.sql import functions as F

delta_log = spark.read.json(
    "abfss://container@storage-account.dfs.core.windows.net/table_location/_delta_log/*.json"
)

files = (
    delta_log
    .filter("add is not null")
    .select(
        F.col("add.path").alias("path"),
        F.col("add.size").alias("size"),
        F.col("add.partitionValues.startDate").alias("startDate")
    )
)

(
    files.groupBy("startDate")
    .agg(
        F.count("*").alias("numFiles"),
        F.sum("size").alias("totalBytes")
    )
    .withColumn("sizeGB", F.col("totalBytes") / (1024**3))
    .orderBy("startDate", ascending=False)
    .show(20, False)
)
```

## Evaluating Partition Strategy

### Undersized Partitions

When daily partitions measure only several MB:
- Excessive partitioning likely exists
- Weekly or monthly partitioning may prove more suitable

### Oversized Partitions

When partitions surpass hundreds of GB:
- Query performance may degrade from excessive scanning
- More granular partitioning strategies warrant consideration

### Uneven File Distribution

Elevated file counts paired with minimal average sizes indicate small file complications.

## Partition Size Guidelines

| Partition Size | Recommendation |
|---|---|
| < 1 GB | Likely over-partitioned |
| 1–20 GB | Usually healthy |
| 50+ GB | Consider finer partitioning |
| 100+ GB | May impact performance |

*(Adjust based on your specific workload patterns and query requirements.)*

## Computing Average File Size

Extend your analysis with:

```python
.withColumn("avgFileSizeMB", (F.col("totalBytes") / F.col("numFiles")) / (1024**2))
```

This calculation identifies small file challenges within individual partitions.

## When to Apply This Method

This strategy proves particularly beneficial for:

- Externally managed Delta table deployments
- Custom storage architecture administration
- Novel partition strategy design
- Transitioning from legacy Hive-formatted tables
- Investigating and resolving performance bottlenecks

## Conclusion

Sound partitioning choices should reflect:

- How queries access data
- Partition value cardinality
- Actual partition storage size
- Distribution of file dimensions

Analyzing Delta transaction logs provides a straightforward yet effective means to evaluate table organization before implementing permanent partitioning decisions.
