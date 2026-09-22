# Memaro

An MCP server for agent memory and instructions. Agents store, search,
update, and link short text memories, and read curated, human-owned
instruction documents (`read_instructions`) — all through MCP tools or a
REST API. Everything is embedded locally and indexed for semantic search.

**Status**: identity exists (org/team/user + API-key auth on both HTTP and
MCP stdio) but nothing is scoped or access-controlled by it yet — every
memory row is still global. What exists today: personal memory (CRUD +
semantic search) and a read-only instructions layer. Not yet built: RBAC
enforcement, memory tenant scoping, a shared/team memory tier, or any
governance/lifecycle tooling.

## Stack

- **PostgreSQL** — memories, tags, relations, instruction docs
- **Qdrant** — vector index (768-dim, dense + sparse hybrid search)
- **Embeddings** — `nomic-ai/nomic-embed-text-v1.5`, run locally via
  `@huggingface/transformers` (no external API)

## Getting started

```bash
docker compose up -d   # Postgres (5433) + Qdrant (6333/6334)
pnpm install
pnpm create-api-key --org "Dev" --email you@example.com   # prints a key, once
MEMARO_API_KEY=<key from above> pnpm dev   # http://localhost:2999 + stdio MCP
```

Production: `pnpm build && pnpm start`.

## Run modes

```bash
node dist/index.js standalone   # MCP stdio + REST (default)
node dist/index.js client       # MCP stdio only
node dist/index.js server       # REST only
```

## Configuration

Two unrelated config files, despite the similar names:

- **`config.yaml`** (repo root, override with `MEMARO_CONFIG`) — global,
  required at startup. Defines every MCP tool's description (the prompt
  text an agent sees) and the memory `types`/`relations` taxonomy used by
  `add_memory`/`link_memory`. The server will not start without one that
  defines all 9 tools — see [`config.yaml`](./config.yaml), this repo's own
  dogfood config, or
  [`config.taskly.example.yaml`](./config.taskly.example.yaml), an example
  of what a real product team's deployment config looks like (pairs with
  the `data/todo-app` dataset below).
- **`.memaro`** (optional, per source directory under `data/<name>/`) —
  scoped to the instructions ingestion pipeline only: per-path tag rules
  and a default `owner`/`scope`. Absence is fully supported (falls back to
  defaults). See `src/ingestion/memaro-config.ts`.

## Instructions layer

`read_instructions` serves curated, human-owned markdown — house rules,
conventions, architecture decisions — that no agent-facing tool can write
to (enforced by a regression test, not just convention). Populate it with:

```bash
pnpm ingest   # walks data/<source>/, embeds into instruction_doc + Qdrant
```

A worked example ships in `data/todo-app/` (a fictional todo-app company's
agent instructions + product/architecture docs) — try it with:

```bash
pnpm ingest
MEMARO_API_KEY=<key> MEMARO_CONFIG=./config.taskly.example.yaml pnpm dev
```

then `read_instructions({ context: "how does task recurrence work" })`.

## MCP tools

| Tool | Description |
|------|-------------|
| `read_instructions` | Read curated instruction docs (read-only) |
| `search_memories` | Semantic search for memories |
| `add_memory` | Store a new memory |
| `get_memory` | Retrieve a memory by ID |
| `update_memory` | Update an existing memory |
| `remove_memory` | Delete a memory by ID |
| `link_memory` | Create a typed relation between two memories |
| `search_tags` | Search for tags by text |
| `add_tag` | Create a new tag |

Connect via stdio — `MEMARO_API_KEY` (from `pnpm create-api-key`) binds the
session's identity once, at startup; a missing or invalid key refuses to
start:

```json
{
  "mcpServers": {
    "memaro": {
      "command": "node",
      "args": ["/path/to/memaro/dist/index.js", "client"],
      "env": {
        "MEMARO_API_KEY": "<key from `pnpm create-api-key`>"
      }
    }
  }
}
```

Or via HTTP JSON-RPC at `POST /mcp` (`initialize`, `tools/list`,
`tools/call`), authenticated the same way as the REST API below.

## REST API

Every route below requires `Authorization: Bearer <key>` (from
`pnpm create-api-key`) — a missing or invalid key gets a 401.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/instructions?context=...` | Read instructions (read-only) |
| `POST` | `/v1/memories` | Create a memory |
| `GET` | `/v1/memories?text=...` | Semantic search |
| `PATCH` | `/v1/memories/:id` | Update a memory |
| `DELETE` | `/v1/memories/:id` | Delete a memory |
| `POST` | `/v1/memory-relations` | Link two memories |
| `PATCH` | `/v1/memory-relations/:id` | Update a relation |
| `DELETE` | `/v1/memory-relations/:id` | Delete a relation |
| `POST` | `/v1/tags` | Create a tag |
| `GET` | `/v1/tags?text=...` | Search tags |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `2999` | HTTP server port |
| `MEMARO_CONFIG` | `./config.yaml` | Path to the config file |
| `MEMARO_DATA_DIR` | `./data` | Root directory `pnpm ingest` scans for sources |
| `MEMARO_API_KEY` | _(none)_ | Binds a stdio session's identity (`client`/`standalone` modes) — required, refuses to start without it |
