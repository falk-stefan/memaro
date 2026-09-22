---
title: Collaboration Model
tags: [collaboration, sharing, permissions, domain-model, product]
owner: product@taskly.dev
scope: team
lastReviewed: 2026-08-12
---

# Collaboration Model

Tasks live inside **projects**. Sharing happens at the project level, never
per-task — a task can't be shared independently of the project it belongs
to, because a huge amount of complexity in early prototypes came from
per-task ACLs interacting badly with recurrence and sync.

## Roles

- **Owner** — created the project, or was explicitly transferred ownership.
  Can invite/remove collaborators, delete the project, change its sharing
  role defaults. Exactly one owner per project.
- **Editor** — can create, edit, complete, and trash tasks within the
  project. Cannot invite new collaborators or delete the project itself.
- **Viewer** — read-only. Used mostly for stakeholders who want visibility
  into a team's task board without editing it.

## What is and isn't shared

- Comments and attachments on a task are visible to every collaborator on
  the project, regardless of role.
- A personal note field exists per-user, per-task ("my private context on
  this task") and is never shared, even with Owners — this is the one
  exception to "sharing happens at the project level."
- Recurrence rules are project data, editable by Owners and Editors alike;
  there's no per-user override of a shared recurring task's schedule.
