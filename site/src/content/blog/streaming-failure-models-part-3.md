---
title: "One Cluster per Task — Proven, Ready, and Waiting"
date: "March 11, 2026"
readTime: "5 min read"
excerpt: "We know what the real answer is. We tested it. The code is ready. We're just waiting for the right moment, and that's a completely legitimate engineering decision."
tags: ["Databricks", "Structured Streaming", "Apache Spark", "Delta Lake"]
---

*Part 3 of 3: Databricks Streaming Architecture*

---

By the end of Part 2, we knew what the real answer was.

We just hadn't committed to it yet.

Not because it wouldn't work. We tested it. We documented it. The code was ready. The answer was one cluster per task — true driver isolation, one JVM per pipeline, failures that cannot by construction spread sideways.

The reason we hadn't switched: budget and scale. That's a completely legitimate engineering decision.

## What "real" isolation actually means

Everything in Parts 1 and 2 lived in this shape:

```
Shared Job Cluster

  Python Proc A    Python Proc B
       \               /
        ┌─────────────┐
        │  Spark JVM  │
        │  (shared)   │
        └─────────────┘
               │
          Executors
```

One driver. Everything that fails, fails together — or worse, fails silently while the rest keeps running.

One cluster per task looks like this:

```
Dedicated Clusters

  Task A              Task B
  Cluster A           Cluster B

  Python Proc         Python Proc
       │                   │
  ┌─────────┐         ┌─────────┐
  │  JVM A  │         │  JVM B  │
  └─────────┘         └─────────┘
       │                   │
  Executors           Executors

Task B fails → Cluster B restarts → Task A: unaffected
```

That last line is the one that matters. Task B crashing cannot reach Task A. No shared driver, no shared memory, no shared scheduler. The failure boundary is the cluster, not the job.

## What the experiment showed

We ran it. Moved our streaming queries onto separate clusters — some as separate tasks in the same job, some as fully independent jobs. Both approaches worked.

Failures stopped spreading. When we deliberately triggered one, the other pipeline kept running correctly — not "mostly healthy." The UI was accurate for the first time, which sounds like a minor thing until you remember how long we'd been staring at misleading dashboards.

Debugging got faster in a way that surprised me. Each cluster has its own driver logs, its own metrics, its own lifecycle. "Which pipeline failed?" stopped requiring timestamp correlation across a shared log stream.

Sizing became honest too. A heavy pipeline gets the compute it needs. A lightweight one runs on something smaller. You're not picking a number that has to cover the worst case across everything.

## The code was already ready

Something we hadn't fully appreciated: we didn't need to rewrite anything.

Our pipelines were structured so the same code could run in any deployment shape:

- All queries in one task, one cluster — the Part 1 setup
- Multiple tasks, shared cluster — the Part 2 setup
- Multiple tasks, dedicated cluster per task — the target architecture

Deployment and configuration change, not a code change. The streaming logic, the Delta writes, the checkpointing — all identical. Only the compute allocation changed.

That was intentional. It also made the experiment cheap to run, which helped.

## Why we're waiting

Cost and scale, honestly.

Right now, our workload fits on a shared cluster without catastrophic failure — especially with `awaitAnyTermination` providing fail-fast semantics on the streaming side and task retries on the batch side. It's not elegant. But it's stable enough for where we are.

Once device count crosses the threshold, the calculus changes. When the operational cost of a missed or false alert exceeds the infrastructure cost of a dedicated cluster, you stop debating. We know roughly where that line is. We're watching the numbers.

## When to make the move

If any of these apply to your setup, you're probably ready:

- A failure in one pipeline has caused a correctness problem in another
- You're spending more time debugging shared-cluster incidents than the extra cluster would cost per month
- Customer impact from partial failures is measurable — missed alerts, false positives, SLA breaches
- Individual pipelines have meaningfully different compute profiles and you're sizing the shared cluster to the worst case

None of these require a crisis. The best time to make the architecture change is before the next incident, not after.

## The progression in one diagram

```
Part 1: Multi-query, shared cluster
→ Problem: silent query failures
→ Fix: awaitAnyTermination (band-aid)

Part 2: Multi-task, shared cluster
→ Problem: still one driver, same failure modes
→ Fix: task-level retry (better, still shared)

Part 3: One cluster per task
→ True isolation
→ Failures contained by construction
→ Ready when the scale justifies it
```

The band-aids in Parts 1 and 2 weren't mistakes. We took a known shortcut because the right answer cost more than the problem did at the time. Knowing that, and knowing what would change it — that's what matters. We know both.

The code is sitting there, ready to go. We flip the switch when the numbers say it's time.

---

*The incident that kicked off this series also involved a `ConcurrentAppendException` that went deeper than a simple retry could fix — Delta isolation levels, `isBlindAppend`, and why you can't always do what you think you can inside `foreachBatch`. That's the next post, and probably the most technically dense thing I'll write this year.*