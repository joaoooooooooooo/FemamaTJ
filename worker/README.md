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

The tree page will then fetch online flowers from:

```text
GET /tree?page=1&size=100
```
