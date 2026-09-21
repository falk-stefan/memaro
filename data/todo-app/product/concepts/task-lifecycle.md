---
title: Task Lifecycle
tags: [task-lifecycle, domain-model, product]
owner: product@taskly.dev
scope: team
lastReviewed: 2026-08-05
---

# Task Lifecycle

A task moves through a fixed set of states. There is no "delete" state —
deletion is represented as a status, not a row removal (see
`decisions/soft-delete-policy.md`).

## States

1. **Inbox** — created but not yet scheduled. Default state for anything
   quick-added without a due date.
2. **Scheduled** — has a due date or a recurrence rule attached.
3. **In progress** — the user has explicitly started it. This is optional;
   most tasks go straight from Scheduled to Done.
4. **Done** — completed. Still visible in list views for 30 days before
   rolling off into the archive view, so a user can un-complete a mistaken
   check-off without digging through the trash.
5. **Archived** — done tasks older than 30 days. Still queryable, excluded
   from every default view.
6. **Trashed** — explicitly deleted by the user. Soft-deleted, purged after
   30 days by the retention job (`decisions/soft-delete-policy.md`).

## Transition rules

- Any state can transition directly to Trashed.
- Trashed tasks can be restored back to whatever state they were in before
  deletion, as long as the 30-day purge window hasn't closed.
- A recurring task's completion doesn't move the *series* to Done — it
  spawns the next occurrence and only that single occurrence moves to Done.
  See `recurring-tasks.md` for how occurrences are generated.
