import { getStroke } from "perfect-freehand";
import { getFlowerVariantById } from "@/features/drawings/lib/flowerVariants";

export const DEFAULT_BRUSH_COLOR = "#A15665";
export const BRUSH_DISPLAY_SIZE = 12;

function average(a, b) {
  return (a + b) / 2;
}

function getSvgPathFromStroke(points) {
  if (points.length < 4) {
    return "";
  }

  let result = "";
  let a = points[0];
  let b = points[1];
  let c = points[2];

  result += `M${a[0].toFixed(2)},${a[1].toFixed(2)} `;
  result += `Q${b[0].toFixed(2)},${b[1].toFixed(2)} `;
  result += `${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`;

  for (let index = 2; index < points.length - 1; index += 1) {
    a = points[index];
    b = points[index + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
  }

  return `${result}Z`;
}

function formatSvgNumber(value) {
  return Number(value.toFixed(1)).toString();
}

function simplifyStrokePoints(points, maxPoints = 90) {
  if (!Array.isArray(points) || points.length <= maxPoints) {
    return points ?? [];
  }

  const step = Math.ceil(points.length / maxPoints);
  const simplifiedPoints = [];

  for (let index = 0; index < points.length; index += step) {
    simplifiedPoints.push(points[index]);
  }

  const lastPoint = points[points.length - 1];

  if (simplifiedPoints[simplifiedPoints.length - 1] !== lastPoint) {
    simplifiedPoints.push(lastPoint);
  }

  return simplifiedPoints;
}

function getPolylinePathData(points) {
  if (!points?.length) {
    return "";
  }

  const simplifiedPoints = simplifyStrokePoints(points);
  const [firstPoint, ...otherPoints] = simplifiedPoints;

  if (!firstPoint) {
    return "";
  }

  return [
    `M${formatSvgNumber(firstPoint.x)} ${formatSvgNumber(firstPoint.y)}`,
    ...otherPoints.map((point) => `L${formatSvgNumber(point.x)} ${formatSvgNumber(point.y)}`),
  ].join(" ");
}

function getStrokePathData(stroke) {
  if (!stroke?.points?.length) {
    return "";
  }

  const outlinePoints = getStroke(
    stroke.points.map((point) => ({
      x: point.x,
      y: point.y,
      pressure: point.pressure,
    })),
    {
      size: stroke.size ?? BRUSH_DISPLAY_SIZE,
      thinning: 0.6,
      smoothing: 0.65,
      streamline: 0.45,
      simulatePressure: !stroke.points.some((point) => typeof point.pressure === "number"),
      last: true,
    },
  );

  return getSvgPathFromStroke(outlinePoints);
}

function drawStroke(context, stroke, scale, pixelRatio) {
  if (!stroke?.points?.length) {
    return;
  }

  const pathData = getStrokePathData({
    ...stroke,
    size: (stroke.size ?? BRUSH_DISPLAY_SIZE) * scale,
    points: stroke.points.map((point) => ({
      ...point,
      x: point.x * scale,
      y: point.y * scale,
    })),
  });

  if (!pathData) {
    return;
  }

  context.fillStyle = stroke.color ?? DEFAULT_BRUSH_COLOR;
  context.fill(new Path2D(pathData));
}

export function renderDrawingToCanvas({
  canvas,
  drawing,
  image,
  pixelRatio = 1,
}) {
  if (!canvas || !drawing || !image) {
    return;
  }

  const context = canvas.getContext("2d");

  if (!context || !canvas.width || !canvas.height || !drawing.width || !drawing.height) {
    return;
  }

  const logicalWidth = canvas.width / pixelRatio;
  const logicalHeight = canvas.height / pixelRatio;
  const scale = logicalWidth / drawing.width;

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  drawing.strokes.forEach((stroke) => {
    drawStroke(context, stroke, scale, pixelRatio);
  });

  context.save();
  context.globalCompositeOperation = "destination-in";
  context.drawImage(image, 0, 0, logicalWidth, logicalHeight);
  context.restore();
}

export function createDrawingSvgMarkup(drawing) {
  if (!drawing?.width || !drawing?.height || !Array.isArray(drawing.strokes)) {
    return "";
  }

  const paths = drawing.strokes
    .map((stroke) => {
      const pathData = getPolylinePathData(stroke.points);

      if (!pathData) {
        return "";
      }

      return `<path d="${pathData}" stroke="${stroke.color ?? DEFAULT_BRUSH_COLOR}" stroke-width="${formatSvgNumber(stroke.size ?? BRUSH_DISPLAY_SIZE)}" stroke-linecap="round" stroke-linejoin="round" fill="none" />`;
    })
    .filter(Boolean)
    .join("");

  if (!paths) {
    return "";
  }

  return `<svg viewBox="0 0 ${drawing.width} ${drawing.height}">${paths}</svg>`;
}

export function createCompactDrawingPayload(drawing) {
  if (!drawing?.width || !drawing?.height || !Array.isArray(drawing.strokes)) {
    return "";
  }

  const compactStrokes = drawing.strokes
    .map((stroke) => {
      const simplifiedPoints = simplifyStrokePoints(stroke.points, 24)
        .map((point) => [
          Number(point.x.toFixed(1)),
          Number(point.y.toFixed(1)),
          Number((point.pressure ?? 0.5).toFixed(2)),
        ]);

      if (!simplifiedPoints.length) {
        return null;
      }

      return {
        c: stroke.color ?? DEFAULT_BRUSH_COLOR,
        s: Number((stroke.size ?? BRUSH_DISPLAY_SIZE).toFixed(1)),
        p: simplifiedPoints,
      };
    })
    .filter(Boolean);

  if (!compactStrokes.length) {
    return "";
  }

  return JSON.stringify({
    v: 1,
    f: drawing.flowerVariantId,
    w: drawing.width,
    h: drawing.height,
    s: compactStrokes,
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nao foi possivel carregar a flor para exportar a imagem."));
    image.src = src;
  });
}

export async function createDrawingImageFile(drawing, fileName = "flower.webp") {
  if (
    typeof window === "undefined"
    || !drawing?.width
    || !drawing?.height
    || !Array.isArray(drawing.strokes)
  ) {
    return null;
  }

  const flowerImage = getFlowerVariantById(drawing.flowerVariantId).imageSrc;
  const image = await loadImage(flowerImage);
  const canvas = document.createElement("canvas");
  canvas.width = drawing.width;
  canvas.height = drawing.height;

  renderDrawingToCanvas({
    canvas,
    drawing,
    image,
    pixelRatio: 1,
  });

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.92);
  });

  if (!blob) {
    throw new Error("Nao foi possivel gerar a imagem da flor.");
  }

  return new File([blob], fileName, { type: "image/webp" });
}
