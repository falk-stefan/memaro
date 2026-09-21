---
title: Backend Coding Style
tags: [backend, coding-style, nodejs, typescript]
owner: backend-team@taskly.dev
lastReviewed: 2026-08-01
---

# Backend Coding Style

Taskly's backend is a Node.js + TypeScript monolith (Express, Postgres, Sequelize).

## Do

- Prefer small, composable service functions over deep class hierarchies —
  the domain (tasks, projects, recurrence rules) is simple enough that
  classes usually just add ceremony.
- Every mutation to a `task` row goes through `TaskService`, never a raw
  Sequelize call from a controller. This is the one place recurrence
  expansion and soft-delete rules are enforced.
- Validate request bodies at the controller boundary with a Zod schema.
  Never trust a client-supplied `id` for a resource the request didn't
  already prove ownership of.

## Do not

- Do not hard-delete rows. Every table that a user can delete from has a
  `deletedAt` column — see `product/decisions/soft-delete-policy.md` for
  why. A `DELETE FROM` in a migration or a one-off script needs sign-off
  from the backend lead.
- Do not add a new task field without also deciding how it participates in
  sync conflict resolution (see `product/decisions/sync-conflict-resolution.md`).
  Fields added without this end up with undefined behavior on offline sync.
