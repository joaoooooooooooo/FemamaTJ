import * as React from "react";
import { deleteTreeDrawings, fetchAllTreeDrawings } from "@/features/drawings/lib/tree-api";

const TREE_REFRESH_INTERVAL_MS = 3000;

export function useTreeDrawings({ enabled = false, url = "" }) {
  const [drawings, setDrawings] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(Boolean(enabled));
  const [latestDrawingId, setLatestDrawingId] = React.useState(null);
  const abortControllerRef = React.useRef(null);
  const isMutatingRef = React.useRef(false);

  const fetchDrawings = React.useCallback(async () => {
    if (!enabled || !url || isMutatingRef.current) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    try {
      const result = await fetchAllTreeDrawings(url, controller.signal);
      if (controller.signal.aborted) return;
      setDrawings(result.drawings);
      setLatestDrawingId(result.latestDrawingId);
      setError(null);
    } catch (fetchError) {
      if (!controller.signal.aborted) {
        setError(fetchError instanceof Error ? fetchError.message : "Não foi possível carregar as flores. Tente novamente.");
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [enabled, url]);

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
    }
  }, [enabled, url]);

  const clearDrawings = React.useCallback(() => deleteDrawings(), [deleteDrawings]);

  React.useEffect(() => {
    if (!enabled || !url) return;
    void fetchDrawings();
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible" && !isMutatingRef.current && !abortControllerRef.current) {
        void fetchDrawings();
      }
    };
    const interval = window.setInterval(refreshIfVisible, TREE_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      abortControllerRef.current?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [enabled, fetchDrawings, url]);

  return { clear: clearDrawings, remove: deleteDrawings, drawings, error, isLoading, latestDrawingId, refresh: fetchDrawings };
}
