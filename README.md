# Memaro

Memaro is an MCP (Model Context Protocol) memory server that gives AI agents persistent, searchable memory. Agents can store, retrieve, update, and semantically search text memories across sessions.

Memories are stored in PostgreSQL (structured metadata) and Qdrant (vector embeddings). Embeddings are generated locally using `sentence-transformers/all-MiniLM-L6-v2` via HuggingFace Transformers — no external embedding API required.

## How it works

Each memory is a short text snippet (up to 320 characters) with an optional type and tags. When a memory is stored, Memaro embeds it and indexes it in Qdrant so agents can find semantically similar memories later. Memories can also be linked to each other with typed relations (e.g. `explains`).

The memory schema — types, relations, and tool descriptions — is driven by a YAML config file, making Memaro adaptable to different agent use cases without changing code.

## Architecture

```
Agent / LLM
    │
    ├── stdio (MCP)        ← direct process integration
    ├── HTTP /mcp          ← JSON-RPC over HTTP
    └── HTTP /v1/*         ← REST API
         │
    ┌────┴────────────────┐
    │     Memaro server   │
    │  (Express + MCP SDK)│
    └────┬────────────────┘
         │
    ┌────┴────────────────┐
    │   PostgreSQL        │  memories, tags, relations
    │   Qdrant            │  vector index (384-dim)
    └─────────────────────┘
```

## Prerequisites

- Node.js 20+
- pnpm
- Docker (for PostgreSQL and Qdrant)

## Getting started

**1. Start the databases**

```bash
docker compose up -d
```

This starts PostgreSQL on port `5433` and Qdrant on ports `6333`/`6334`.

**2. Install dependencies**

```bash
pnpm install
```

**3. Run in development mode**

```bash
pnpm dev
```

The server starts on `http://localhost:2999` and also listens on stdio for MCP clients.

**4. Build for production**

```bash
pnpm build
pnpm start
```

## Run modes

Pass the mode as the first CLI argument:

| Mode         | Description                                      |
|--------------|--------------------------------------------------|
| `standalone` | MCP stdio + REST API (default)                   |
| `client`     | MCP stdio only                                   |
| `server`     | REST API only                                    |

```bash
node dist/index.js standalone
node dist/index.js client
node dist/index.js server
```

## Configuration

Memaro loads `config.yaml` by default. Override with the `MEMARO_CONFIG` environment variable:

```bash
MEMARO_CONFIG=./my-config.yaml node dist/index.js
```

The config file controls:
- **Tool descriptions** — what the agent sees for each MCP tool
- **Memory types** — e.g. `product`, `rationale` (define as many as needed)
- **Relation types** — e.g. `explains`

See [`config.yaml`](./config.yaml) for the full structure.

## MCP tools

| Tool              | Description                                      |
|-------------------|--------------------------------------------------|
| `search_memories` | Semantic search for memories by text             |
| `add_memory`      | Store a new memory (text, type, optional tags)   |
| `get_memory`      | Retrieve a memory by ID                          |
| `update_memory`   | Update an existing memory                        |
| `remove_memory`   | Delete a memory by ID                            |
| `link_memory`     | Create a typed relation between two memories     |
| `search_tags`     | Search for tags by text                          |
| `add_tag`         | Create a new tag                                 |

### Connecting via stdio (Claude Desktop / Claude Code)

Add to your MCP client config:

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

### Connecting via HTTP

The server exposes a JSON-RPC endpoint at `POST /mcp` compatible with HTTP-based MCP clients.

## REST API

The REST API is available when running in `standalone` or `server` mode.

| Method   | Path                        | Description                    |
|----------|-----------------------------|--------------------------------|
| `POST`   | `/v1/memories`              | Create a memory                |
| `GET`    | `/v1/memories?text=...`     | Semantic search for memories   |
| `PATCH`  | `/v1/memories/:id`          | Update a memory                |
| `DELETE` | `/v1/memories/:id`          | Delete a memory                |
| `POST`   | `/v1/memory-relations`      | Link two memories              |
| `PATCH`  | `/v1/memory-relations/:id`  | Update a memory relation       |
| `DELETE` | `/v1/memory-relations/:id`  | Delete a memory relation       |
| `POST`   | `/v1/tags`                  | Create a tag                   |
| `GET`    | `/v1/tags?text=...`         | Search tags                    |

Default port: `2999`. Override with the `PORT` environment variable.

## Environment variables

| Variable        | Default         | Description                          |
|-----------------|-----------------|--------------------------------------|
| `PORT`          | `2999`          | HTTP server port                     |
| `MEMARO_CONFIG` | `./config.yaml` | Path to the Memaro config file       |
