import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import * as miniflare from "miniflare";
import ts from "typescript";
import { deleteTreeDrawings, fetchAllTreeDrawings } from "../../src/features/drawings/lib/tree-api.js";

test("admin flower operations against isolated Durable Object storage", async (t) => {
  const source = await readFile(new URL("../src/index.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  const options = {
    modules: true, script: outputText, compatibilityDate: "2025-08-01",
    durableObjects: { TREE_STORE: { className: "TreeStore", useSQLite: true } },
  };
  const runtime = new miniflare.Miniflare(
    miniflare.convertV4MiniflareOptions ? miniflare.convertV4MiniflareOptions(options) : options,
  );
  t.after(() => runtime.dispose());
  const fetchWorker = (path, init) => runtime.dispatchFetch(`http://admin.test${path}`, init);
  const ingest = (id) => fetchWorker("/webhook/forminit", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "form.submitted", id, data: { flower_text: `Flor ${id}` } }),
  });
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = (url, init) => runtime.dispatchFetch(url, init);

  await t.test("loads every flower across more than one page", async () => {
    for (let index = 0; index < 135; index += 1) {
      assert.equal((await ingest(`flower-${index}`)).status, 200);
    }
    const result = await fetchAllTreeDrawings("http://admin.test");
    assert.equal(result.drawings.length, 135);
    assert.equal(new Set(result.drawings.map((flower) => flower.id)).size, 135);
  });
  await t.test("deletes exactly one flower and persists after refetch", async () => {
    await deleteTreeDrawings("http://admin.test", "flower-42");
    const result = await fetchAllTreeDrawings("http://admin.test");
    assert.equal(result.drawings.length, 134);
    assert.ok(!result.drawings.some((flower) => flower.id === "flower-42"));
    assert.ok(result.drawings.some((flower) => flower.id === "flower-43"));
  });
  await t.test("supports encoded IDs and repeated deletion", async () => {
    const id = "flor / ç & ? #";
    await ingest(id);
    await deleteTreeDrawings("http://admin.test", id);
    await deleteTreeDrawings("http://admin.test", id);
    assert.equal((await fetchAllTreeDrawings("http://admin.test")).drawings.length, 134);
  });
  await t.test("rejects malformed IDs without deleting other flowers", async () => {
    assert.equal((await fetchWorker("/tree/%ZZ", { method: "DELETE" })).status, 400);
    assert.equal((await fetchAllTreeDrawings("http://admin.test")).drawings.length, 134);
  });
  await t.test("reset removes more than 128 flowers and accepts new submissions", async () => {
    await deleteTreeDrawings("http://admin.test");
    const empty = await fetchAllTreeDrawings("http://admin.test");
    assert.deepEqual(empty, { drawings: [], latestDrawingId: null });
    await ingest("after-reset");
    assert.equal((await fetchAllTreeDrawings("http://admin.test")).drawings[0].id, "after-reset");
  });
  await t.test("failed delete rejects instead of reporting success", async () => {
    globalThis.fetch = async () => Response.json({ success: false }, { status: 500 });
    await assert.rejects(deleteTreeDrawings("http://admin.test", "after-reset"));
  });
});
