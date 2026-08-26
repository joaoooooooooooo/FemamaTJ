import * as React from "react";

export interface SavedFlowerDrawingPoint {
  x: number;
  y: number;
}

export interface SavedFlowerDrawingStroke {
  color: string;
  size: number;
  points: SavedFlowerDrawingPoint[];
}

export interface SavedFlowerDrawing {
  id: string;
  createdAt: string;
  flowerVariantId: string;
  width: number;
  height: number;
  strokes: SavedFlowerDrawingStroke[];
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
  drawings: SavedFlowerDrawing[];
  saveDrawing: (
    drawing: Omit<SavedFlowerDrawing, "id" | "createdAt">,
  ) => SavedFlowerDrawing;
};
