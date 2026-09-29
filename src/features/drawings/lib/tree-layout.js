import frameReference from "@/assets/Frame Ref02.svg?raw";

// Read the artist's markers directly so SVG edits cannot drift from the layout.
const reference = new DOMParser().parseFromString(frameReference, "image/svg+xml");
export const DRAWING_POINTS = Array.from(reference.querySelectorAll("circle"))
  .map((marker) => ({
    x: Number(marker.getAttribute("cx")),
    y: Number(marker.getAttribute("cy")),
  }))
  .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

export const TREE_FLOWER_LIMIT = DRAWING_POINTS.length;
