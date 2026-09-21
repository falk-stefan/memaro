---
title: Frontend Coding Style
tags: [frontend, coding-style, react]
owner: frontend-team@taskly.dev
lastReviewed: 2026-08-01
---

# Frontend Coding Style

The web app is React + Vite, the mobile app is Expo/React Native. Both share
the `@taskly/ui-core` component package.

## Do

- Model list state (task lists, project boards) with a reducer, not a pile
  of `useState` calls — task lists get reordered, filtered, and optimistically
  updated from sync all at once, and that only stays sane with a single
  state transition function.
- Show optimistic updates immediately for anything the user did locally
  (checking off a task, reordering), then reconcile silently when the sync
  response arrives. Never block the UI on a network round trip for a local
  edit.
- Use the shared `<RecurrenceBadge>` component whenever a recurring task is
  rendered — it already encodes the rules in
  `product/concepts/recurring-tasks.md`; don't re-derive "next due date"
  logic in a new component.

## Do not

- Do not call the REST API directly from a component. Go through the
  generated API client so offline queuing (see
  `product/decisions/sync-conflict-resolution.md`) stays centralized.
