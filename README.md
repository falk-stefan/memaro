# Memaro

An MCP server for agent memory. Agents store, search, update, and link short
text memories through MCP tools or a REST API. Memories are embedded locally
and indexed for semantic search.

## Stack

- **PostgreSQL** — memories, tags, relations
- **Qdrant** — vector index (384-dim)
- **Embeddings** — `sentence-transformers/all-MiniLM-L6-v2`, run locally via
  `@huggingface/transformers` (no external API)

## Getting started

```bash
docker compose up -d   # Postgres (5433) + Qdrant (6333/6334)
pnpm install
pnpm dev                # http://localhost:2999 + stdio MCP
```

Production: `pnpm build && pnpm start`.

## Run modes

```bash
node dist/index.js standalone   # MCP stdio + REST (default)
node dist/index.js client       # MCP stdio only
node dist/index.js server       # REST only
```

## Configuration

Memaro loads `config.yaml` (override with `MEMARO_CONFIG`). It defines the
MCP tool descriptions and the memory `types`/`relations` used by the current
config — see [`config.yaml`](./config.yaml).

## MCP tools

| Tool | Description |
|------|-------------|
| `search_memories` | Semantic search for memories |
| `add_memory` | Store a new memory |
| `get_memory` | Retrieve a memory by ID |
| `update_memory` | Update an existing memory |
| `remove_memory` | Delete a memory by ID |
| `link_memory` | Create a typed relation between two memories |
| `search_tags` | Search for tags by text |
| `add_tag` | Create a new tag |

Connect via stdio:

```json
{
  "mcpServers": {
    "memaro": {
      "command": "node",
      "args": ["/path/to/memaro/dist/index.js", "client"]
    }
  }
}
```

Or via HTTP JSON-RPC at `POST /mcp`.

## REST API

| Method | Path | Description |
|--------|------|-------------|
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
