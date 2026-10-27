---
title: "A paused stream is a countdown: when the checkpoint outlives the Delta log"
date: "October 27, 2026"
readTime: "7 min read"
excerpt: "We paused a streaming job in staging and forgot about it. Sixty days later it couldn't start, because the source table had cleaned up the log versions its checkpoint still pointed at. Same job, same error, twice."
tags: ["Databricks", "Structured Streaming", "Delta Lake", "Incident Analysis"]
---

I unpaused a staging job this morning and it died in its first task.

```
DeltaIllegalStateException: [DELTA_MISSING_FILES_UNEXPECTED_VERSION]
The stream from your Delta table was expecting process data from version 38628,
but the earliest available version in the _delta_log directory is 39822.
The files in the transaction log may have been deleted due to log cleanup.
```

The annoying part is that I'd seen this exact error on this exact job in August. There's a comment in the job config from that day: `# previous checkpoint lagged past the source's 30-day log retention`. I fixed it, the job ran once, someone paused the schedule, and the countdown started again.

---

## The setup

The job reads a bronze table of device events with `readStream`, aggregates them into daily features, and writes those to Delta. It runs with `Trigger.AvailableNow`: start, drain whatever is new, stop. In production it runs on a schedule. In staging the schedule was paused, because nobody needed fresh staging features until last week.

The source table is busy. Ingestion appends to it all day, so it gets thousands of commits a month. It has no custom retention, which means `delta.logRetentionDuration` is the default 30 days.

The job ran on 28 August. The next run was 27 October. Sixty days of a paused schedule.

---

## What the checkpoint actually remembers

A Delta streaming source doesn't remember a timestamp or a row. It remembers a table version. Open any file under `<checkpoint>/offsets/` and you'll see it:

```json
{"sourceVersion":1,"reservoirId":"6a1f...","reservoirVersion":38628,"index":-1,"isStartingVersion":false}
```

`reservoirVersion` is the next version of the source table the stream wants to read. On restart, Delta goes to `_delta_log/`, finds that version's commit file, and carries on from there.

Meanwhile, the source table keeps living its own life. Every time Delta writes a log checkpoint, it can also clean up commit files older than `logRetentionDuration`. Nobody asks the stream first. The source table has no idea a paused consumer still cares about version 38628.

So while the job sat paused, the source kept committing and kept cleaning up. By the time the job came back, the oldest commit left was 39822, about 1,200 versions past the one the checkpoint wanted. On restart, the stream asked for a version that no longer existed, and Delta refused to guess.

Refusing is the right default. The alternative is starting from whatever version is left and quietly skipping weeks of data.

---

## The four ways out

**1. `failOnDataLoss = false`.** The error message suggests it. It lets the stream continue from the earliest version still available.

```python
spark.readStream.option("failOnDataLoss", "false").table("bronze.device_events")
```

It works, and I didn't use it. It doesn't recover anything. It just turns a loud failure into a silent gap. For a staging job that might be fine. For anything that feeds a report or an alert, a silent gap is worse than a crash, because nobody goes looking for it.

**2. Delete the checkpoint and start over.** With no starting option, a fresh stream reads the whole table: every version that's still retained, plus a snapshot of the starting state. On a busy bronze table that's a big first batch. We'd already learned that one the hard way: this job has `maxBytesPerTrigger` capped at 256 MB because an uncapped first batch on a fresh checkpoint ran the driver out of memory.

It also replays everything into the sink. If your writes aren't idempotent, you now have duplicates.

**3. New checkpoint with a bounded start.** This is what I did, both times:

```python
(spark.readStream
    .option("startingTimestamp", "2026-09-30")
    .option("maxBytesPerTrigger", "256m")
    .table("bronze.device_events"))
```

Point the stream at a new checkpoint path (`daily_features_v3`, after `_v2` in August), and pick a start date inside the retention window with a few days of margin. The first run backfilled four weeks in 22 minutes. The gap before 30 September stays a gap, but it's a gap I chose and wrote down, not one Delta picked for me.

Two catches. `startingTimestamp` is only honoured on a fresh checkpoint, so reusing the old path does nothing. And the date has to stay inside retention until the run actually happens. If the PR sits in review for a week, recompute it.

**4. Keep more log on the source.**

```sql
ALTER TABLE bronze.device_events
SET TBLPROPERTIES ('delta.logRetentionDuration' = 'interval 90 days');
```

This moves the cliff. It doesn't remove it. A job paused for 91 days hits the same wall. It also grows `_delta_log` on a table with thousands of commits a month, which makes log listing and checkpointing slower for every reader of that table, not just the paused one. I'd only do this if a consumer genuinely needs to pause for long periods. A staging job that someone forgot about doesn't count.

---

## Why it happened twice

The August fix was correct. What it didn't change was the reason the job fell behind: a paused schedule with no one watching the checkpoint.

A paused batch job is safe. Unpause it in a year and it reads whatever is there. A paused streaming job isn't. It holds a reference into another table's history, and that history expires. The schedule says "paused", but the stream is going stale the whole time.

So I'd stop trusting the schedule and watch the checkpoint. Read `reservoirVersion` from the latest offset file, look up that version's timestamp in `DESCRIBE HISTORY` on the source, and alert when it's more than about 20 days old against 30-day retention. That's a small job, and it would have caught both incidents weeks early.

And any paused job that uses `readStream` needs an owner and a date someone plans to unpause it. If nobody can name either, it should be deleted rather than left to rot.

There was a second surprise in the same job, with the same cause. Staging only ran the first of the eight tasks production runs. Nobody noticed, because nobody looked at staging output until last week.

---

## What I changed

The checkpoint moved to `_v3` with a 30 September start, two lines below the August comment that explains `_v2`. Staging now also runs the alert tasks, so the tables downstream exist there too.

The schedule is still paused in staging, because nobody wants to pay for a cluster to compute staging features every day. That means I'll hit this again unless something watches the checkpoint. The lag check above is next on my list, and until it exists, the job description should say plainly that the checkpoint goes stale 30 days after the last run.

The config change took ten minutes, both times. The sixty days it took anyone to notice is the part I still have to fix.
