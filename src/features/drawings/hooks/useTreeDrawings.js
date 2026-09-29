import * as React from "react";
import { deleteTreeDrawings, fetchAllTreeDrawings } from "@/features/drawings/lib/tree-api";
import { applyTreeUpsert, connectTreeLive } from "@/features/drawings/lib/tree-live";

export function useTreeDrawings({ enabled = false, url = "", limit = null }) {
  const [drawings, setDrawings] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(Boolean(enabled));
  const [latestDrawingId, setLatestDrawingId] = React.useState(null);
  const abortControllerRef = React.useRef(null);
  const isMutatingRef = React.useRef(false);
  const hasSnapshotRef = React.useRef(false);
  const snapshotRetryRef = React.useRef(null);

  const fetchDrawings = React.useCallback(async function fetchSnapshot() {
    if (!enabled || !url || isMutatingRef.current) return;
    window.clearTimeout(snapshotRetryRef.current);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    try {
      const result = await fetchAllTreeDrawings(url, controller.signal, limit);
      if (controller.signal.aborted) return;
      hasSnapshotRef.current = true;
      setDrawings(result.drawings);
      setLatestDrawingId(result.latestDrawingId);
      setError(null);
    } catch (fetchError) {
      if (!controller.signal.aborted) {
        setError(fetchError instanceof Error ? fetchError.message : "Não foi possível carregar as flores. Tente novamente.");
        // A working socket does not guarantee that the HTTP snapshot succeeded.
        snapshotRetryRef.current = window.setTimeout(() => { void fetchSnapshot(); }, 3000);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [enabled, url, limit]);

  const deleteDrawings = React.useCallback(async (id) => {
    if (!enabled || !url || isMutatingRef.current) {
      return { error: "Não foi possível excluir agora. Tente novamente." };
    }
    isMutatingRef.current = true;
    // A list fetched before the deletion must never restore deleted flowers.
    abortControllerRef.current?.abort();
    setIsLoading(false);
    try {
      await deleteTreeDrawings(url, id);
      setDrawings((current) => id === undefined ? [] : current.filter((flower) => flower.id !== id));
      setLatestDrawingId((current) => id === undefined || current === id ? null : current);
      setError(null);
      return { error: null };
    } catch {
      return { error: "Não foi possível excluir as flores. Verifique a conexão e tente novamente." };
    } finally {
      isMutatingRef.current = false;
      // Reconcile concurrent submissions and refill the last visible slot after removal.
      void fetchDrawings();
    }
  }, [enabled, url, fetchDrawings]);

  const clearDrawings = React.useCallback(() => deleteDrawings(), [deleteDrawings]);

  React.useEffect(() => {
    if (!enabled || !url) return;
    hasSnapshotRef.current = false;
    let stop;
    const start = () => {
      stop?.();
      stop = undefined;
      if (document.visibilityState !== "visible") {
        window.clearTimeout(snapshotRetryRef.current);
        abortControllerRef.current?.abort();
        return;
      }
      stop = connectTreeLive({
        url,
        onRefresh: (force) => {
          if (force || !abortControllerRef.current) void fetchDrawings();
        },
        onChange: (event) => {
          if (isMutatingRef.current) return; // Mutation completion fetches a snapshot.
          if (abortControllerRef.current || !hasSnapshotRef.current) {
            // Never allow an older HTTP response to overwrite a pushed update.
            void fetchDrawings();
            return;
          }
          if (event.type === "upsert") {
            const flower = event.drawing;
            if (!flower || typeof flower.id !== "string" || typeof flower.createdAt !== "string") return;
            setDrawings((current) => applyTreeUpsert(current, flower, limit));
            setLatestDrawingId(flower.id);
            setError(null);
          } else if (event.type === "clear") {
            setDrawings([]);
            setLatestDrawingId(null);
          } else {
            // A removed visible flower may expose the next flower in history.
            void fetchDrawings();
          }
        },
      });
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      stop?.();
      window.clearTimeout(snapshotRetryRef.current);
      abortControllerRef.current?.abort();
      document.removeEventListener("visibilitychange", start);
    };
  }, [enabled, fetchDrawings, url, limit]);

  return { clear: clearDrawings, remove: deleteDrawings, drawings, error, isLoading, latestDrawingId, refresh: fetchDrawings };
}
