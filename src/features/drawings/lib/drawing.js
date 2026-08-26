export const DEFAULT_BRUSH_COLOR = "#A15665";
export const DEFAULT_BRUSH_SIZE = 32;

function drawStroke(context, stroke, scaleX, scaleY) {
  if (!stroke?.points?.length) {
    return;
  }

  context.strokeStyle = stroke.color ?? DEFAULT_BRUSH_COLOR;
  context.lineWidth = (stroke.size ?? DEFAULT_BRUSH_SIZE) * ((scaleX + scaleY) / 2);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();

  stroke.points.forEach((point, index) => {
    const x = point.x * scaleX;
    const y = point.y * scaleY;

    if (index === 0) {
      context.moveTo(x, y);
      return;
    }

    context.lineTo(x, y);
  });

  context.stroke();
}

export function renderDrawingToCanvas({
  canvas,
  drawing,
  image,
  maskCanvas,
}) {
  if (!canvas || !drawing || !image || !maskCanvas) {
    return;
  }

  const context = canvas.getContext("2d");
  const maskContext = maskCanvas.getContext("2d");

  if (!context || !maskContext || !canvas.width || !canvas.height) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  const scaleX = canvas.width / drawing.width;
  const scaleY = canvas.height / drawing.height;

  drawing.strokes.forEach((stroke) => {
    drawStroke(context, stroke, scaleX, scaleY);
  });

  maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  maskContext.drawImage(image, 0, 0, maskCanvas.width, maskCanvas.height);

  context.save();
  context.globalCompositeOperation = "destination-in";
  context.drawImage(maskCanvas, 0, 0, canvas.width, canvas.height);
  context.restore();
}

export function getScaledPoint(event, canvas, drawingWidth, drawingHeight) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * drawingWidth,
    y: ((event.clientY - rect.top) / rect.height) * drawingHeight,
  };
}
