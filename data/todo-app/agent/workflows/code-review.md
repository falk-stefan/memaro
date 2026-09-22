---
title: Code Review Workflow
tags: [code-review, workflow, pull-request]
owner: eng-leads@taskly.dev
lastReviewed: 2026-07-20
---

# Code Review Workflow

- Every PR touching `TaskService`, recurrence expansion, or sync conflict
  resolution needs a review from someone on the backend team, even if the
  author is on backend themselves — this is the code most likely to corrupt
  a user's task list silently, and a second set of eyes has caught real
  bugs here before.
- Small, focused PRs only. A PR that touches both a schema migration and
  unrelated UI copy gets split before review, not after.
- Reviewers: check for the two most common mistakes in this codebase first —
  a raw Sequelize call bypassing `TaskService` (see
  `coding-style/backend.md`), and a new field with no defined sync
  conflict behavior.
