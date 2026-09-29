import assert from "node:assert/strict";
import { test } from "node:test";
import { applyTreeUpsert, connectTreeLive } from "../../src/features/drawings/lib/tree-live.js";

test("live connection stops polling, detects dropped connections, resyncs, and cleans up", () => {
  let id = 0;
  const tasks = new Map();
  const timers = {
    setInterval(fn, ms) { tasks.set(++id, { fn, ms }); return id; },
    setTimeout(fn, ms) { tasks.set(++id, { fn, ms, once: true }); return id; },
    clearInterval(key) { tasks.delete(key); },
    clearTimeout(key) { tasks.delete(key); },
  };
  const fire = (ms) => {
    const entry = [...tasks].find(([, task]) => task.ms === ms);
    assert.ok(entry, `Expected a ${ms}ms timer`);
    if (entry[1].once) tasks.delete(entry[0]);
    entry[1].fn();
  };
  const sockets = [];
  class Socket {
    constructor(url) { this.url = url; sockets.push(this); }
    close() { this.closed = true; }
    send(message) { this.sent = message; }
  }
  const updates = [];
  const refreshes = [];
  const stop = connectTreeLive({ url: "https://tree.test", WebSocketImpl: Socket, timers,
    onChange: (event) => updates.push(event), onRefresh: (force) => refreshes.push(force) });
  assert.equal(sockets[0].url, "wss://tree.test/tree/live");
  sockets[0].onopen();
  assert.ok(![...tasks.values()].some((task) => task.ms === 3000));
  sockets[0].onmessage({ data: JSON.stringify({ type: "upsert", drawing: { id: "a" } }) });
  assert.equal(updates.length, 1);
  fire(25000);
  assert.equal(sockets[0].sent, "ping");
  sockets[0].onmessage({ data: "pong" });
  assert.ok(![...tasks.values()].some((task) => task.ms === 10000));
  fire(25000);
  fire(10000); // A half-open connection did not answer its heartbeat.
  assert.equal(sockets[0].closed, true);
  fire(3000);
  assert.equal(refreshes.at(-1), false);
  fire(1000);
  sockets[1].onopen();
  assert.equal(refreshes.at(-1), true); // Recover updates missed while disconnected.
  stop();
  assert.equal(tasks.size, 0);
  assert.equal(sockets[1].closed, true);
});

test("upserts deduplicate, order, cap the tree, and retain full admin history", () => {
  const flowers = Array.from({ length: 100 }, (_, i) => ({ id: String(i), createdAt: new Date(i * 1000).toISOString() }));
  const newest = { id: "new", createdAt: new Date(200000).toISOString(), flowerText: "amor" };
  const tree = applyTreeUpsert(flowers, newest, 83);
  assert.equal(tree.length, 83);
  assert.deepEqual(tree[0], newest);
  assert.equal(applyTreeUpsert(tree, newest, 83).length, 83);
  assert.equal(applyTreeUpsert(flowers, newest, null).length, 101);
});
