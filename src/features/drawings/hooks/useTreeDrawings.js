import * as React from "react";

const TREE_REFRESH_INTERVAL_MS = 3000;

function normalizeTreeFlower(flower) {
  return {
    ...flower,
    flowerText: flower.flowerText ?? flower.flower_text ?? "",
    flowerVariantId: flower.flowerVariantId ?? flower.flower_variant_id ?? "flower-1",
  };
}

export function useTreeDrawings({ enabled = false, url = "" }) {
  const [drawings, setDrawings] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(Boolean(enabled));
  const [latestDrawingId, setLatestDrawingId] = React.useState(null);
  const hasFetchedRef = React.useRef(false);
  const abortControllerRef = React.useRef(null);
  const latestDrawingIdRef = React.useRef(null);

  const fetchDrawings = React.useCallback(async () => {
    if (!enabled || !url) {
      return;
    }

    abortControllerRef.current?.abort?.();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/tree?page=1&size=100`, {
        headers: {
          Accept: "application/json",
        },
        signal: abortController.signal,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Nao foi possivel carregar a arvore online.");
      }

      setDrawings(
        Array.isArray(result.drawings)
          ? result.drawings.map(normalizeTreeFlower)
          : [],
      );

      if (latestDrawingIdRef.current !== (result.latestDrawingId ?? null)) {
        setLatestDrawingId(result.latestDrawingId ?? null);
        latestDrawingIdRef.current = result.latestDrawingId ?? null;
      }
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return;
      }

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Nao foi possivel carregar a arvore online.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, url]);

  const clearDrawings = React.useCallback(async () => {
    if (!enabled || !url) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/tree`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Nao foi possivel limpar a arvore online.");
      }

      latestDrawingIdRef.current = null;
      setLatestDrawingId(null);
      setDrawings([]);
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Nao foi possivel limpar a arvore online.",
      );
    }
  }, [enabled, url]);

  React.useEffect(() => {
    if (!enabled || !url) {
      hasFetchedRef.current = false;
      abortControllerRef.current?.abort?.();
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchDrawings();

    return () => {
      abortControllerRef.current?.abort?.();
    };
  }, [enabled, fetchDrawings, url]);

  React.useEffect(() => {
    if (!enabled || !url) {
      return;
    }

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        fetchDrawings();
      }
    };

    const intervalId = window.setInterval(refreshIfVisible, TREE_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [enabled, fetchDrawings, url]);

  return {
    clear: clearDrawings,
    drawings,
    error,
    isLoading,
    latestDrawingId,
    refresh: fetchDrawings,
  };
}
