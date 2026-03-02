---
title: "Real-Time Analytics Platform"
date: "2024"
excerpt: "Built streaming data platform processing 10M+ events per day with sub-second latency using Structured Streaming."
tags: ["Streaming", "Spark", "Delta Lake", "Real-time"]
githubUrl: ""
---

## Project Overview

Designed and implemented a real-time analytics platform to process high-volume event streams with sub-second latency.

## Business Requirements

- Process 10M+ events daily
- Sub-second latency for critical metrics
- 99.9% uptime SLA
- Real-time dashboards
- Historical data analysis

## Architecture Design

### Streaming Ingestion
- Apache Kafka for event streaming
- Structured Streaming for processing
- Auto Loader for batch catchup

### Processing Pipeline

```python
# Streaming aggregation example
from pyspark.sql.functions import *

events = spark.readStream \
  .format("kafka") \
  .option("kafka.bootstrap.servers", "broker:9092") \
  .option("subscribe", "events") \
  .load()

metrics = events \
  .select(from_json(col("value").cast("string"), schema).alias("data")) \
  .select("data.*") \
  .withWatermark("timestamp", "10 seconds") \
  .groupBy(
    window("timestamp", "1 minute"),
    "event_type",
    "user_segment"
  ) \
  .agg(
    count("*").alias("event_count"),
    avg("value").alias("avg_value"),
    percentile_approx("value", 0.95).alias("p95_value")
  )

metrics.writeStream \
  .format("delta") \
  .outputMode("append") \
  .option("checkpointLocation", "/checkpoints/metrics") \
  .table("gold.real_time_metrics")
```

### Storage Strategy
- Hot path: Delta Lake (last 30 days)
- Warm path: Compressed Delta (31-365 days)
- Cold path: Azure Storage (>365 days)

## Performance Optimization

### Partitioning Strategy
```sql
CREATE TABLE gold.real_time_metrics
PARTITIONED BY (date DATE, hour INT)
AS SELECT * FROM streaming_metrics
```

### Checkpointing
- Separate checkpoint locations per stream
- Azure Storage for durability
- Regular cleanup of old checkpoints

## Results

### Performance
- Average latency: 500ms (p95: 1.2s)
- Throughput: 12M events/day
- 99.95% uptime achieved

### Business Impact
- Real-time fraud detection
- Dynamic pricing based on live metrics
- Instant customer insights

## Tech Stack

- **Streaming**: Apache Kafka, Spark Structured Streaming
- **Storage**: Delta Lake
- **Platform**: Databricks on Azure
- **Monitoring**: Datadog, Grafana
- **Orchestration**: Airflow
