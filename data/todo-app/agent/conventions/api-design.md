---
title: API Design Conventions
tags: [api-design, rest, conventions, backend]
owner: backend-team@taskly.dev
lastReviewed: 2026-08-10
---

# API Design Conventions

- Every list endpoint is paginated with `cursor`/`limit`, never plain
  `offset` — task lists are reordered live by other clients, and offset
  pagination skips or repeats rows under concurrent writes.
- Mutations return the full updated resource, not just a status code — the
  offline sync queue (see `product/decisions/sync-conflict-resolution.md`)
  replays queued mutations and needs the server's resolved state back to
  reconcile the local optimistic copy.
- Soft-deleted resources are excluded from `GET` list endpoints by default;
  add `?includeDeleted=true` only for the trash view. Never expose a
  separate "purge" endpoint over the public API — purge only happens via
  the internal retention job.
- Version breaking changes via a new route prefix (`/v2/...`), never a
  request header. Mobile clients can be months behind the latest release
  due to app-store review, so header-based versioning has silently broken
  old clients before.
