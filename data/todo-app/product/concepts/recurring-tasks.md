---
title: Recurring Tasks
tags: [recurring-tasks, domain-model, product]
owner: product@taskly.dev
scope: team
lastReviewed: 2026-08-05
---

# Recurring Tasks

A recurring task is stored as one **series** row plus zero or more
**occurrence** rows. The series holds the recurrence rule; each occurrence
is a normal task row with a pointer back to its series.

## Rule format

Recurrence rules are a restricted subset of RFC 5545 (RRULE): `FREQ`
(DAILY/WEEKLY/MONTHLY), `INTERVAL`, and `BYDAY`. We deliberately don't
support the full RRULE grammar (no `BYSETPOS`, no secondary frequencies) —
user testing showed nobody used them, and the extra surface area doubled
the number of edge cases in occurrence generation.

## Occurrence generation

- Only the *next* occurrence is materialized as a real task row at any
  time — we don't pre-generate a year of future occurrences. This keeps
  "edit this occurrence only" vs. "edit the whole series" unambiguous:
  editing the series changes the rule; editing the materialized occurrence
  only ever affects that one row.
- Completing an occurrence generates the next one immediately, using the
  rule evaluated from the *original* due date, not the completion date — a
  task due every Monday stays anchored to Monday even if the user
  completes it three days late.
- Deleting the series (not just an occurrence) trashes the current
  occurrence and does not generate a next one.

## Edge cases worth knowing

- A `BYDAY` rule that no longer matches any day in a given month (rare, but
  possible with certain interval/weekday combinations) skips that period
  silently rather than erroring — logged, not surfaced to the user.
- Changing a series' recurrence rule never retroactively changes an
  already-materialized occurrence that's due before the edit.
