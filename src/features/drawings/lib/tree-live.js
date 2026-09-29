// A healthy socket sends only changes and tiny heartbeats. HTTP polling runs
// only while disconnected, including when talking to an older Worker.
export function connectTreeLive({ url, onChange, onRefresh, WebSocketImpl = globalThis.WebSocket, timers = globalThis }) {
  const endpoint = new URL(`${url.replace(/\/$/, "")}/tree/live`);
  endpoint.protocol = endpoint.protocol === "https:" ? "wss:" : "ws:";
  let socket;
  let stopped = false;
  let retry;
  let heartbeat;
  let watchdog;
  let fallback;
  let attempts = 0;

  const startFallback = () => {
    if (!fallback) fallback = timers.setInterval(() => onRefresh(false), 3000);
  };
  const disconnect = () => {
    timers.clearInterval(heartbeat);
    timers.clearTimeout(watchdog);
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      socket.close();
      socket = null;
    }
  };
  const failed = () => {
    if (stopped) return;
    disconnect();
    startFallback();
    timers.clearTimeout(retry);
    retry = timers.setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)));
  };
  const connect = () => {
    if (stopped) return;
    try {
      socket = new WebSocketImpl(endpoint.href);
      // Detect stalled handshakes as well as half-open connections.
      watchdog = timers.setTimeout(failed, 10000);
      socket.onopen = () => {
        timers.clearTimeout(watchdog);
        timers.clearInterval(fallback);
        fallback = null;
        attempts = 0;
        // Subscribe before fetching: changes during the fetch cause a restart.
        onRefresh(true);
        heartbeat = timers.setInterval(() => {
          try {
            socket.send("ping");
            watchdog = timers.setTimeout(failed, 10000);
          } catch { failed(); }
        }, 25000);
      };
      socket.onmessage = ({ data }) => {
        if (data === "pong") {
          timers.clearTimeout(watchdog);
          return;
        }
        try {
          const event = JSON.parse(data);
          if (["upsert", "remove", "clear"].includes(event.type)) onChange(event);
        } catch { failed(); }
      };
      socket.onerror = socket.onclose = failed;
    } catch { failed(); }
  };
  startFallback();
  onRefresh(true);
  connect();
  return () => {
    stopped = true;
    timers.clearTimeout(retry);
    timers.clearInterval(fallback);
    disconnect();
  };
}

export function applyTreeUpsert(drawings, drawing, limit) {
  return [...drawings.filter((item) => item.id !== drawing.id), drawing]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, limit ?? Infinity);
}
