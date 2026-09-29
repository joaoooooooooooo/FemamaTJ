# Femama Tree Worker

Cloudflare Worker that reads Forminit submissions securely and exposes a public `/tree` endpoint for the frontend.

## Setup

1. `cd worker`
2. `npm install`
3. `npx wrangler secret put FORMINIT_API_KEY`
4. `npx wrangler deploy`

## Frontend

After deploy, add the Worker URL to the frontend:

```bash
VITE_TREE_API_URL="https://your-worker.your-subdomain.workers.dev"
```

The tree page takes an initial snapshot of the latest 61 flowers:

```text
GET /tree?page=1&size=61
```

It connects to `/tree/live` using WebSockets. After a verified Forminit webhook
is saved, the existing TreeStore broadcasts an `upsert` with that flower to all
connected displays. Deletions broadcast `remove`; resets broadcast `clear`.
The socket accepts no client mutations. Cloudflare's hibernation API handles
`ping`/`pong` heartbeats without reading storage or keeping the object awake.

Healthy connections do not poll. If a connection fails, the client polls every
three seconds while retrying the socket with backoff. Reconnection takes a fresh
snapshot to recover missed updates. Deletions refresh the snapshot to refill the
last visible slot. Hidden tabs disconnect and resynchronize when visible again.
Admin and saved-drawings pages retain complete pagination and receive live updates.
The questionnaire does not download the tree collection.

Deploy the Worker first, then the frontend. Existing clients keep working with
the HTTP endpoints; new clients fall back to polling if the Worker has not yet
been updated. This reuses the existing `main-tree` Durable Object and storage:
no migration or clearing of submitted flowers is required. Delivery begins when
Forminit's webhook reaches the Worker, so Forminit's delivery time still applies.

Validation: `npm test` uses isolated Miniflare storage, including two independent
WebSocket clients. Run `npx tsc --noEmit` for Worker types. Regenerate platform
types with `npx wrangler types` when changing bindings or compatibility settings.
