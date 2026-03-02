const projects = [
  {
    slug: 'enterprise-lakehouse-migration',
    title: 'Enterprise Lakehouse Migration',
    date: '2025',
    excerpt: 'Migrated legacy data warehouse to modern lakehouse architecture, reducing costs by 45% and improving query performance.',
    tags: ['Delta Lake', 'Databricks', 'Migration', 'AWS'],
    githubUrl: '',
    content: `
# Enterprise Lakehouse Migration

## Overview

Led the migration of a legacy on-premise data warehouse to a modern cloud-based lakehouse architecture using Delta Lake and Databricks.

## Challenge

The organization faced:
- High maintenance costs for on-premise infrastructure
- Limited scalability
- Slow query performance
- Data silos across departments

## Solution Architecture

### Data Ingestion Layer
- Implemented Auto Loader for incremental data ingestion
- CDC pipelines for real-time updates
- Multi-source connectors (RDBMS, APIs, SaaS)

### Storage Layer
- Medallion architecture (Bronze/Silver/Gold)
- Delta Lake for ACID transactions
- Optimized partitioning strategy

### Processing Layer
- Apache Spark for batch processing
- Structured Streaming for real-time
- Optimized cluster configurations

### Consumption Layer
- Unity Catalog for governance
- SQL Analytics for BI tools
- REST APIs for application integration

## Technical Implementation

\`\`\`python
# Example: Bronze to Silver transformation
from pyspark.sql.functions import *
from delta.tables import DeltaTable

# Read from Bronze
df_bronze = spark.readStream \\
  .format("delta") \\
  .table("bronze.raw_events")

# Transform to Silver
df_silver = df_bronze \\
  .dropDuplicates(["event_id"]) \\
  .filter(col("event_time") >= current_date() - 90) \\
  .withColumn("processed_timestamp", current_timestamp()) \\
  .withColumn("data_quality_flag",
    when(col("amount") < 0, "invalid").otherwise("valid"))

# Write to Silver with merge
df_silver.writeStream \\
  .format("delta") \\
  .outputMode("append") \\
  .option("checkpointLocation", "/checkpoints/silver_events") \\
  .table("silver.events")
\`\`\`

## Results

### Performance Improvements
- 60% reduction in average query time
- 10x faster data ingestion
- Real-time dashboards (vs. daily updates)

### Cost Savings
- 45% reduction in infrastructure costs
- 30% reduction in maintenance overhead
- Eliminated hardware refresh cycles

### Business Impact
- Self-service analytics for business users
- Faster time-to-insight
- Improved data quality and governance

## Key Learnings

1. **Incremental Migration**: Phased approach reduced risk
2. **Data Quality First**: Established DQ checks in Silver layer
3. **Performance Testing**: Load testing prevented production issues
4. **Training**: Invested in team upskilling

## Tech Stack

- **Platform**: Databricks on AWS
- **Storage**: Delta Lake
- **Processing**: Apache Spark 3.x
- **Orchestration**: Databricks Workflows
- **Governance**: Unity Catalog
- **BI**: Power BI, Tableau
    `
  },
  {
    slug: 'real-time-data-platform',
    title: 'Real-Time Analytics Platform',
    date: '2024',
    excerpt: 'Built streaming data platform processing 10M+ events per day with sub-second latency using Structured Streaming.',
    tags: ['Streaming', 'Spark', 'Delta Lake', 'Real-time'],
    githubUrl: '',
    content: `
# Real-Time Analytics Platform

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

\`\`\`python
# Streaming aggregation example
from pyspark.sql.functions import *

# Read stream
events = spark.readStream \\
  .format("kafka") \\
  .option("kafka.bootstrap.servers", "broker:9092") \\
  .option("subscribe", "events") \\
  .load()

# Parse and aggregate
metrics = events \\
  .select(from_json(col("value").cast("string"), schema).alias("data")) \\
  .select("data.*") \\
  .withWatermark("timestamp", "10 seconds") \\
  .groupBy(
    window("timestamp", "1 minute"),
    "event_type",
    "user_segment"
  ) \\
  .agg(
    count("*").alias("event_count"),
    avg("value").alias("avg_value"),
    percentile_approx("value", 0.95).alias("p95_value")
  )

# Write to Delta
metrics.writeStream \\
  .format("delta") \\
  .outputMode("append") \\
  .option("checkpointLocation", "/checkpoints/metrics") \\
  .table("gold.real_time_metrics")
\`\`\`

### Storage Strategy
- Hot path: Delta Lake (last 30 days)
- Warm path: Compressed Delta (31-365 days)
- Cold path: S3 (>365 days)

## Performance Optimization

### Partitioning Strategy
\`\`\`sql
CREATE TABLE gold.real_time_metrics
PARTITIONED BY (date DATE, hour INT)
AS SELECT * FROM streaming_metrics
\`\`\`

### Checkpointing
- Separate checkpoint locations per stream
- S3 for durability
- Regular cleanup of old checkpoints

### State Management
- Optimized state store configuration
- Watermarking for event-time processing
- Late data handling strategies

## Monitoring & Alerting

### Key Metrics
- Processing latency (p50, p95, p99)
- Throughput (events/second)
- Batch processing time
- State store size

### Alerts
- Latency threshold breaches
- Stream failure detection
- Data quality anomalies

## Results

### Performance
- Average latency: 500ms (p95: 1.2s)
- Throughput: 12M events/day
- 99.95% uptime achieved

### Business Impact
- Real-time fraud detection
- Dynamic pricing based on live metrics
- Instant customer insights

## Lessons Learned

1. **Watermarking is Critical**: Proper watermark configuration prevents state explosion
2. **Monitoring First**: Comprehensive monitoring saved countless debugging hours
3. **Idempotency**: Design for at-least-once processing
4. **Backpressure Handling**: Plan for traffic spikes

## Tech Stack

- **Streaming**: Apache Kafka, Spark Structured Streaming
- **Storage**: Delta Lake
- **Platform**: Databricks
- **Monitoring**: Datadog, Grafana
- **Orchestration**: Airflow
    `
  }
];

export function getProjects() {
  return projects;
}

export function getProject(slug) {
  return projects.find(project => project.slug === slug);
}
