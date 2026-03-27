---
title: "Four Hallucinations and a Python Script"
date: "March 27, 2026"
readTime: "8 min read"
excerpt: "I asked an LLM agent to get a Databricks job ID at runtime. It confidently proposed four approaches. All four were wrong. The fix was a 30-line Python script I could have written in ten minutes."
tags: ["Databricks", "LLM", "AI Agents", "Software Engineering", "PySpark"]
---

I had a custom metrics table. It was working. Batch durations, row counts, streaming heartbeats, all landing in Delta. One problem: the `job_id` and `run_id` columns were null in every row.

These two columns exist so you can join custom metrics to Databricks system tables. Without them, my per-batch timing data lives in isolation. With them, one SQL join gives you batch internals correlated with job cost, cluster utilization, and run outcomes. The whole point of the table.

So I asked my LLM coding agent to fix it. What followed was an afternoon I won't get back.

## Hallucination 1: Spark conf

The agent's first suggestion:

```python
job_id = spark.conf.get("spark.databricks.job.id")
run_id = spark.conf.get("spark.databricks.job.runId")
```

Sensible-looking. There are plenty of Stack Overflow answers and blog posts mentioning these keys. The agent had probably trained on hundreds of them.

The result on our serverless compute:

```
ERROR: [CONFIG_NOT_AVAILABLE] Configuration spark.databricks.job.id is not available.
```

Not "key not found." Not "returns null." A hard error with a JVM stack trace 80 lines long. This config key doesn't exist in the Spark Connect protocol that serverless uses. The agent had no way to know that because it trained on content from the classic compute era.

## Hallucination 2: environment variables

After the Spark conf failure, the agent pivoted to environment variables:

```python
import os
job_id = int(os.environ["DATABRICKS_JOB_ID"])
run_id = int(os.environ["DATABRICKS_RUN_ID"])
```

This one was interesting because the agent didn't just suggest reading env vars. It invented the variable names. `DATABRICKS_JOB_ID` is not a real environment variable that Databricks sets. The agent generated a plausible-sounding name, wrote the code with confidence, and I deployed it.

The metrics kept showing null.

I dumped every environment variable matching "JOB", "RUN", or "DATABRICKS" from a running job. Here's what Databricks actually sets:

```
DATABRICKS_RUNTIME_VERSION=client.5.1
DATABRICKS_CLUSTER_LIBS_PYTHON_ROOT_DIR=python
DATABRICKS_GANGLIA_ENABLED=FALSE
```

Runtime metadata. Library paths. Nothing about job or run identity. `DATABRICKS_JOB_ID` doesn't exist. The agent made it up.

## Hallucination 3: dbutils notebook context

This one almost worked. The agent suggested reading the Databricks notebook context:

```python
ctx = dbutils.notebook.entry_point.getDbutils().notebook().getContext()
job_id = int(ctx.tags().get("jobId").get())
run_id = int(ctx.tags().get("idInJob").get())
```

It's a real API. I later confirmed it returns valid job IDs when called from a notebook. The problem is we don't run notebooks. We run Python wheel tasks. And in wheel task context:

```
module 'pyspark.dbutils' has no attribute 'notebook'
```

The `pyspark.dbutils` module loads, but the `notebook` sub-module doesn't. No notebook, no notebook context. The agent found a working API and assumed it works everywhere.

## Hallucination 4: dynamic references in spark_env_vars

At this point I pulled up the Databricks docs myself. I found the page on dynamic value references. The agent read it too and proposed putting `{{job_id}}` in the DAB `spark_env_vars`:

```yaml
spark_env_vars:
  DATABRICKS_JOB_ID: "{{job_id}}"
  DATABRICKS_RUN_ID: "{{run_id}}"
```

Two problems. First, the syntax was wrong. The correct dynamic reference is `{{job.id}}`, not `{{job_id}}`. Second, and more fundamentally, `spark_env_vars` doesn't resolve dynamic value references at all. The values pass through as literal strings. The cluster environment showed:

```
DATABRICKS_RUN_ID={{run_id}}
```

Not the run ID. The literal text `{{run_id}}`.

The Databricks docs don't say "dynamic value references don't work in spark_env_vars." They just don't list spark_env_vars as a supported location. The docs describe where they do work (task parameters, job parameters), but they never explicitly say where they don't. That silence is a trap for both humans and language models.

## The documentation problem

The Databricks documentation for dynamic value references says you can use `{{job.id}}` in "parameters or fields that pass context into tasks." It gives examples for notebook `base_parameters` and job-level `parameters`. For Python wheel tasks, it says "parameters defined in the task definition are passed as keyword arguments to your code."

What it doesn't say:
- Which specific YAML fields support resolution and which don't
- That `spark_env_vars` passes values through without resolving them
- That the old `spark.databricks.job.id` conf key doesn't work on serverless
- That `dbutils.notebook` doesn't load in non-notebook task types

Every hallucination mapped to a gap in the documentation. The agent wasn't generating random nonsense. It was generating reasonable-sounding answers to questions the docs leave unanswered. And incomplete docs are accelerant for LLM hallucination. The model has enough context to sound right, but not enough to actually be right.

## The human fix: stop guessing, start testing

After four failed attempts, I did what I should have done first. I wrote a test script:

```python
import sys
import os

print("=== sys.argv ===")
print(sys.argv)

print("\n=== Job-related env vars ===")
for key in sorted(os.environ):
    if "JOB" in key or "RUN" in key or "DATABRICKS" in key:
        print(f"  {key}={os.environ[key]}")

print("\n=== Spark conf ===")
try:
    from pyspark.sql import SparkSession
    spark = SparkSession.builder.getOrCreate()
    for key in ["spark.databricks.job.id", "spark.databricks.job.runId"]:
        try:
            print(f"  {key}={spark.conf.get(key)}")
        except Exception as e:
            print(f"  {key}=ERROR: {e}")
except Exception as e:
    print(f"  Spark init failed: {e}")

print("\n=== dbutils context ===")
try:
    from dbruntime.databricks_repl_context import get_context
    ctx = get_context()
    print(f"  jobId={ctx.jobId}")
    print(f"  idInJob={ctx.idInJob}")
except Exception as e:
    print(f"  repl_context failed: {e}")
```

30 lines. Created a Databricks job, added job parameters with `{{job.id}}` and `{{job.run_id}}`, set the task parameters to pass them as CLI args, ran it.

The output told me everything in one shot:

- `sys.argv` had the resolved job and run IDs from the task parameters
- Every env var approach was dead
- Spark conf threw hard errors
- `dbruntime.databricks_repl_context` actually worked too (undocumented but functional)

Ten minutes from "let me just test this" to knowing exactly which approaches work and which don't. Compare that to four rounds of agent suggestions, deployments, and failures.

## The working solution

Job-level parameters with dynamic value references, referenced from task `named_parameters`. The values arrive as `sys.argv` and get parsed with argparse:

```yaml
# DAB job definition
parameters:
  - name: job_id
    default: "{{job.id}}"
  - name: run_id
    default: "{{job.run_id}}"

tasks:
  - python_wheel_task:
      entry_point: "my-workflow"
      named_parameters:
        job_id: "{{job.parameters.job_id}}"
        run_id: "{{job.parameters.run_id}}"
```

```python
# In the base Workflow class
@staticmethod
def _parse_job_context():
    import argparse, sys
    parser = argparse.ArgumentParser()
    parser.add_argument("--job_id", type=int, default=None)
    parser.add_argument("--run_id", type=int, default=None)
    args, _ = parser.parse_known_args(sys.argv[1:])
    return args.job_id, args.run_id
```

We put the parsing in the base `Workflow` class. Any workflow that enables metrics gets job context automatically. The only per-workflow work is adding the `parameters` and `named_parameters` blocks to the DAB YAML.

## Not an anti-AI post

I'm not writing this to dunk on LLMs. I use one every day. It wrote most of the boilerplate in our metrics writer. It's genuinely good at generating code when the problem is well-understood and the patterns are common.

But there's a specific failure mode that showed up four times in one afternoon: the agent treats documentation gaps as opportunities to interpolate. When the docs don't say how to do something, it constructs an answer from adjacent knowledge. `spark.databricks.job.id` exists in older Databricks content, so it suggests that. `DATABRICKS_` is a common prefix for their env vars, so it invents one. The `dbutils.notebook.entry_point` chain works in notebooks, so it assumes it works everywhere.

Every suggestion sounded plausible. Every one failed for a reason the agent couldn't know without actually running the code.

The fix wasn't more prompting or a better model. It was stepping back, writing a test script, and reading the output. Old school. The kind of thing you learn in your first year of debugging: when you don't know what's happening, print everything and look.

I keep hearing that LLM agents will replace software engineers. Maybe they'll replace the ones who accept the first answer without testing it. The rest of us, the ones who isolate problems, keep feedback loops tight, and don't trust anything until we see it work, I think we'll be fine for a while.

Probably the most useful thing the agent did all afternoon was generate the test script I should have written at the start.
