---
title: Release Process
tags: [release, deployment, workflow]
owner: eng-leads@taskly.dev
lastReviewed: 2026-06-30
---

# Release Process

- Backend and web deploy independently, multiple times a day, via the
  standard CI pipeline — no manual approval needed for either.
- Mobile releases go through app-store review, so they ship on a weekly
  train, not continuously. Because of this lag, every backend API change
  must stay backward-compatible with at least the previous two mobile
  releases (roughly three weeks of clients in the wild at once).
- Before cutting a mobile release, run the offline-sync regression suite
  against the currently-deployed backend, not just against a local
  instance — the whole point is catching drift between what's already in
  production and what mobile is about to ship.
