---
title: Soft Delete Policy
tags: [soft-delete, data-retention, architecture-decision]
owner: backend-team@taskly.dev
scope: team
lastReviewed: 2026-07-01
---

# Soft Delete Policy

Nothing a user deletes is hard-deleted immediately. Every deletable table
(`task`, `project`, `comment`, `attachment`) carries a `deletedAt` column.

## Why

Two incidents drove this: an early beta user accidentally deleted a shared
project with three collaborators' history in it, and a sync bug briefly
caused a client to replay a stale delete against a task that had since been
heavily edited by someone else. Soft delete turned both from "unrecoverable
data loss" into "restore from trash."

## Retention window

- Trashed tasks and projects are restorable for 30 days, then purged by a
  nightly retention job.
- Purge is a real `DELETE`, not another status flag — at 30 days we do
  intend for the data to be gone, both for storage cost and because
  indefinite retention of deleted user content has its own privacy
  tradeoffs.
- The retention job is the *only* code path allowed to hard-delete rows
  from these tables. No controller, no admin tool, and no ad-hoc script may
  bypass it — see `agent/coding-style/backend.md`'s sign-off requirement
  for any direct `DELETE FROM`.

## Interaction with sharing

Trashing a shared project trashes it for every collaborator, not just the
person who deleted it — there's no per-user "hide this for me" state,
deliberately, so collaborators always see a consistent view of what still
exists.
