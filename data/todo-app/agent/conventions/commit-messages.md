---
title: Commit Messages
tags: [commit-message, git, conventions]
owner: eng-leads@taskly.dev
lastReviewed: 2026-07-15
---

# Commit Messages

- Prefix with the affected area: `backend:`, `web:`, `mobile:`, `infra:`.
- Reference the Linear issue id at the end, e.g. `(TASK-482)`. Every commit
  should trace back to a ticket — if there isn't one yet, create it first.
- Write the summary line in the imperative mood ("Add recurrence exception
  handling", not "Added" or "Adds").
- If the commit changes sync/offline behavior, say so explicitly in the
  body — these are the changes most likely to need a careful changelog
  entry for the mobile team, since app-store review lag means old and new
  sync logic run against each other in production for days at a time.
