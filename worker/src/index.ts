import { DurableObject } from "cloudflare:workers";

export interface Env {
  FORMINIT_WEBHOOK_SECRET?: string;
  TREE_STORE: DurableObjectNamespace;
}

type StoredTreeFlower = {
  createdAt: string;
  debugLabel?: string | null;
  flowerVariantId: string;
  flowerText: string;
  id: string;
  source?: string;
};

type TreeStoreListResponse = {
  drawings: StoredTreeFlower[];
  latestDrawingId: string | null;
  success: true;
  total: number;
};

type TreeStoreClearResponse = {
  cleared: true;
  success: true;
};

const TREE_STORE_NAME = "main-tree";

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Forminit-Webhook-Id, Forminit-Webhook-Timestamp, Forminit-Webhook-Signature",
    "Cache-Control": "no-store",
    Accept: "application/json",
  };
}

function createJsonResponse(
  payload: Record<string, unknown>,
  options: {
    headers: Record<string, string>;
    status?: number;
  },
) {
  return Response.json(payload, {
    headers: options.headers,
    status: options.status,
  });
}

function normalizeDate(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return new Date().toISOString();
}

function getTextValue(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function hexToBytes(hex: string) {
  const output = new Uint8Array(hex.length / 2);

  for (let index = 0; index < hex.length; index += 2) {
    output[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }

  return output;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }

  return mismatch === 0;
}

async function verifyForminitWebhook(rawBody: ArrayBuffer, headers: Headers, secret?: string) {
  if (!secret) {
    return { ok: true, webhookId: headers.get("Forminit-Webhook-Id") ?? null };
  }

  const webhookId = headers.get("Forminit-Webhook-Id") ?? "";
  const timestamp = headers.get("Forminit-Webhook-Timestamp") ?? "";
  const signatureHeader = headers.get("Forminit-Webhook-Signature") ?? "";
  const match = signatureHeader.match(/^v1=([a-f0-9]{64})$/);

  if (!/^wh_[A-Za-z0-9_-]+$/.test(webhookId) || !/^\d+$/.test(timestamp) || !match) {
    return { ok: false, webhookId: null };
  }

  const ageInSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));

  if (ageInSeconds > 300) {
    return { ok: false, webhookId: null };
  }

  const encoder = new TextEncoder();
  const prefixBytes = encoder.encode(`v1.${webhookId}.${timestamp}.`);
  const rawBytes = new Uint8Array(rawBody);
  const signedContent = new Uint8Array(prefixBytes.length + rawBytes.length);
  signedContent.set(prefixBytes);
  signedContent.set(rawBytes, prefixBytes.length);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const expectedBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, signedContent),
  );
  const receivedBytes = hexToBytes(match[1]);

  return {
    ok: timingSafeEqual(expectedBytes, receivedBytes),
    webhookId,
  };
}

function normalizeWebhookSubmission(payload: Record<string, unknown>) {
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const flowerVariantId = getTextValue(data.flower_variant_id) ?? "flower-1";
  const flowerText = (getTextValue(data.flower_text) ?? "").trim().slice(0, 40);
  const debugTreeValue =
    getTextValue(data.debug_tree_value)
    ?? getTextValue((data.sender as Record<string, unknown> | undefined)?.userId)
    ?? String(payload.id ?? crypto.randomUUID());

  return {
    createdAt: normalizeDate(
      payload.submissionDate ?? payload.createdAt ?? payload.date ?? payload.timestamp,
    ),
    debugLabel: debugTreeValue,
    flowerVariantId,
    flowerText,
    id: debugTreeValue,
    source: "webhook-text",
  } satisfies StoredTreeFlower;
}

async function getTreeStoreStub(env: Env) {
  const durableObjectId = env.TREE_STORE.idFromName(TREE_STORE_NAME);
  return env.TREE_STORE.get(durableObjectId);
}

export class TreeStore extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/list") {
      const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
      const size = Math.max(1, Number(url.searchParams.get("size") ?? "100"));
      const offset = (page - 1) * size;
      const entries = await this.ctx.storage.list<StoredTreeFlower>({
        prefix: "drawing:",
      });
      const drawings = Array.from(entries.values())
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

      return Response.json({
        drawings: drawings.slice(offset, offset + size),
        latestDrawingId: drawings[0]?.id ?? null,
        success: true,
        total: drawings.length,
      } satisfies TreeStoreListResponse);
    }

    if (request.method === "POST" && url.pathname === "/ingest") {
      const drawing = await request.json() as StoredTreeFlower;
      await this.ctx.storage.put(`drawing:${drawing.id}`, drawing);

      return Response.json({ received: true, success: true });
    }

    if (request.method === "DELETE" && url.pathname === "/remove") {
      const id = url.searchParams.get("id");
      if (!id) return Response.json({ success: false }, { status: 400 });
      await this.ctx.storage.delete(`drawing:${id}`);
      return Response.json({ removed: true, success: true });
    }

    if (request.method === "DELETE" && url.pathname === "/clear") {
      // This object contains only the current tree; deleteAll also handles large resets.
      await this.ctx.storage.deleteAll();

      return Response.json({ cleared: true, success: true } satisfies TreeStoreClearResponse);
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = corsHeaders(request.headers.get("Origin"));

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (url.pathname === "/") {
      return createJsonResponse(
        {
          success: true,
          message: "Femama tree worker online.",
          routes: {
            clear: "/tree",
            list: "/tree?page=1&size=100",
            webhook: "/webhook/forminit",
          },
        },
        { headers },
      );
    }

    if (url.pathname === "/tree" && request.method === "GET") {
      const page = url.searchParams.get("page") ?? "1";
      const size = url.searchParams.get("size") ?? "100";
      const treeStore = await getTreeStoreStub(env);
      const response = await treeStore.fetch(`https://tree-store/list?page=${page}&size=${size}`);
      const result = await response.json() as TreeStoreListResponse;

      if (!response.ok) {
        return createJsonResponse(
          {
            message: "Nao foi possivel carregar a arvore online.",
            success: false,
          },
          { headers, status: response.status },
        );
      }

      return createJsonResponse(
        {
          drawings: result.drawings,
          latestDrawingId: result.latestDrawingId,
          pagination: {
            count: result.drawings.length,
            currentPage: Number(page),
            size: Number(size),
            total: result.total,
          },
          success: true,
        },
        { headers },
      );
    }

    if (url.pathname.startsWith("/tree/") && request.method === "DELETE") {
      let id: string;
      try {
        id = decodeURIComponent(url.pathname.slice("/tree/".length));
      } catch {
        return createJsonResponse({ message: "Identificador inválido.", success: false }, { headers, status: 400 });
      }
      if (!id) return createJsonResponse({ message: "Identificador obrigatório.", success: false }, { headers, status: 400 });
      const treeStore = await getTreeStoreStub(env);
      const response = await treeStore.fetch(`https://tree-store/remove?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      return createJsonResponse(
        response.ok ? { removed: true, success: true } : { message: "Não foi possível excluir a flor.", success: false },
        { headers, status: response.status },
      );
    }

    if (url.pathname === "/tree" && request.method === "DELETE") {
      const treeStore = await getTreeStoreStub(env);
      const response = await treeStore.fetch("https://tree-store/clear", {
        method: "DELETE",
      });

      if (!response.ok) {
        return createJsonResponse(
          {
            message: "Nao foi possivel limpar a arvore online.",
            success: false,
          },
          { headers, status: response.status },
        );
      }

      return createJsonResponse(
        {
          cleared: true,
          success: true,
        },
        { headers },
      );
    }

    if (url.pathname === "/webhook/forminit" && request.method === "POST") {
      const rawBody = await request.arrayBuffer();
      const verification = await verifyForminitWebhook(
        rawBody,
        request.headers,
        env.FORMINIT_WEBHOOK_SECRET,
      );

      if (!verification.ok) {
        return createJsonResponse(
          {
            message: "Webhook invalido.",
            success: false,
          },
          { headers, status: 401 },
        );
      }

      if (rawBody.byteLength === 0) {
        return createJsonResponse(
          {
            received: true,
            success: true,
            webhookId: verification.webhookId,
          },
          { headers },
        );
      }

      let payload: Record<string, unknown>;

      try {
        payload = JSON.parse(new TextDecoder().decode(rawBody)) as Record<string, unknown>;
      } catch {
        return createJsonResponse(
          {
            message: "JSON invalido.",
            success: false,
          },
          { headers, status: 400 },
        );
      }

      if (payload.event !== "form.submitted") {
        return createJsonResponse(
          {
            ignored: true,
            received: true,
            success: true,
            webhookId: verification.webhookId,
          },
          { headers },
        );
      }

      const drawing = normalizeWebhookSubmission(payload);
      const treeStore = await getTreeStoreStub(env);
      const storeResponse = await treeStore.fetch("https://tree-store/ingest", {
        body: JSON.stringify(drawing),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!storeResponse.ok) {
        return createJsonResponse(
          {
            message: "Nao foi possivel salvar a flor na arvore.",
            success: false,
          },
          { headers, status: storeResponse.status },
        );
      }

      return createJsonResponse(
        {
          drawingId: drawing.id,
          received: true,
          success: true,
          webhookId: verification.webhookId,
        },
        { headers },
      );
    }

    return createJsonResponse(
      { message: "Not found", success: false },
      { headers, status: 404 },
    );
  },
};
