---
title: Sync Conflict Resolution
tags: [sync, offline, conflict-resolution, architecture-decision]
owner: backend-team@taskly.dev
scope: team
lastReviewed: 2026-07-01
---

# Sync Conflict Resolution

Taskly is offline-first: mobile and web both queue mutations locally and
replay them against the server when connectivity returns. This document
covers what happens when two clients edited the same task while both were
offline.

## Decision: per-field last-write-wins, not vector clocks

We evaluated a full vector-clock / CRDT approach and rejected it for this
version — the complexity is only worth it if concurrent edits to the *same
field* are common, and usage data showed collaborators almost always edit
different fields of a shared task (one person reschedules, another adds a
comment) rather than racing on the same one.

Instead, each field on a task carries its own `updatedAt` timestamp
server-side. On replay, the server applies an incoming field change only if
its client-side timestamp is newer than the field's current server
timestamp. This means two people can edit *different* fields of the same
task while offline and both edits survive; only a true same-field race
picks the later write and silently drops the earlier one.

## Consequence for new fields

Any new field added to `task` must get a per-field `updatedAt` companion
column, or it defaults to whole-row last-write-wins — which is almost never
what you want, since it means an unrelated field edit racing on sync can
silently revert someone else's concurrent change to this new field too.
See `agent/coding-style/backend.md` for the reviewer checklist item this
maps to.

## Known limitation

Deleting a task (moving it to Trashed) is a whole-row operation and always
wins over any concurrent field edit replaying after it — if you edit a task
offline and someone else deletes it before your sync completes, your edit
is discarded, not reapplied to a restored copy. This is a deliberate
simplification, revisit if it becomes a real complaint.
