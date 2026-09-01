import * as React from "react";

export interface SavedFlowerDrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface SavedFlowerDrawingStroke {
  color: string;
  size: number;
  points: SavedFlowerDrawingPoint[];
}

export interface SavedFlowerDrawing {
  id: string;
  createdAt: string;
  debugLabel?: string;
  flowerVariantId: string;
  flowerText?: string;
  width?: number;
  height?: number;
  imageType?: string;
  imageUrl?: string;
  strokes?: SavedFlowerDrawingStroke[];
  svgPaths?: Array<{
    d: string;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
  }>;
}

export function DrawingDialog(props: {
  flowerVariantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (drawing: Omit<SavedFlowerDrawing, "id" | "createdAt">) => void;
}): React.ReactElement;

export function SavedDrawingsPage(props: {
  drawings: SavedFlowerDrawing[];
  onBack: () => void;
}): React.ReactElement;

export function useSavedFlowerDrawings(): {
  clearDrawings: () => void;
  drawings: SavedFlowerDrawing[];
  saveDrawing: (
    drawing: Omit<SavedFlowerDrawing, "id" | "createdAt"> & {
      id?: string;
    },
  ) => SavedFlowerDrawing;
};

export function useTreeDrawings(input: {
  enabled?: boolean;
  url?: string;
}): {
  clear: () => Promise<void>;
  drawings: SavedFlowerDrawing[];
  error: string | null;
  isLoading: boolean;
  latestDrawingId: string | null;
  refresh: () => Promise<void>;
};
