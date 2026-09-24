import * as React from "react";
import {
  DEFAULT_FLOWER_VARIANT_ID,
  getRandomFlowerVariantId,
} from "@/features/drawings/lib/flowerVariants";

const STORAGE_KEY = "femama.saved-flower-drawings";

function readSavedDrawings() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? parsedValue.map((drawing) => ({
        ...drawing,
        flowerVariantId: drawing.flowerVariantId ?? DEFAULT_FLOWER_VARIANT_ID,
      }))
      : [];
  } catch {
    return [];
  }
}

export function useSavedFlowerDrawings() {
  const [drawings, setDrawings] = React.useState(() => readSavedDrawings());

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drawings));
  }, [drawings]);

  React.useEffect(() => {
    const syncDrawings = (event) => {
      if (event.storageArea === window.localStorage && (event.key === STORAGE_KEY || event.key === null)) {
        setDrawings(readSavedDrawings());
      }
    };
    window.addEventListener("storage", syncDrawings);
    return () => window.removeEventListener("storage", syncDrawings);
  }, []);

  const saveDrawing = React.useCallback((drawing) => {
    const drawingEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      flowerVariantId: drawing.flowerVariantId ?? getRandomFlowerVariantId(),
      ...drawing,
    };

    setDrawings((currentDrawings) => [drawingEntry, ...currentDrawings]);

    return drawingEntry;
  }, []);

  const clearDrawings = React.useCallback(() => {
    setDrawings([]);
  }, []);

  const removeDrawing = React.useCallback((id) => {
    setDrawings((current) => current.filter((drawing) => drawing.id !== id));
  }, []);

  return {
    clearDrawings,
    drawings,
    removeDrawing,
    saveDrawing,
  };
}
