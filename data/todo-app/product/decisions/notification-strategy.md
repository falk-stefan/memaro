---
title: Notification Strategy
tags: [notifications, push, architecture-decision]
owner: product@taskly.dev
scope: team
lastReviewed: 2026-08-18
---

# Notification Strategy

Three channels exist: push (mobile), email (digest only, never per-event),
and in-app. This document is about *which channel gets which event* and why
email is deliberately limited.

## Channel assignment

- **Push**: due-date reminders, and being added as a collaborator to a
  project. These are time-sensitive or one-time — a delayed email digest
  would defeat the purpose of either.
- **Email**: a daily digest only ("3 tasks due today, 1 overdue"), sent once
  per user per day regardless of how many events occurred. We explicitly
  rejected per-event email early on — beta feedback was near-unanimous that
  per-event email for a todo app becomes noise within a week and drives
  disabling notifications entirely, including the ones people actually
  wanted.
- **In-app**: everything else (comments, project role changes) — visible in
  the notification center but never pushed or emailed.

## Quiet hours

Push notifications respect a per-user quiet-hours window (default 22:00–
07:00 local time); due-date reminders scheduled inside that window are
delayed to the window's end, not dropped. This is a hard rule, not a
per-notification-type override — every new push notification type added
must go through the same quiet-hours gate, not bypass it for being
"important."
