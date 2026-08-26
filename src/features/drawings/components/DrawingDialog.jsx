import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_BRUSH_COLOR,
  DEFAULT_BRUSH_SIZE,
  getScaledPoint,
  renderDrawingToCanvas,
} from "@/features/drawings/lib/drawing";
import { getFlowerVariantById } from "@/features/drawings/lib/flowerVariants";

function getCanvasSize(container) {
  const width = Math.round(container.clientWidth);
  const height = Math.round(container.clientHeight);

  return { width, height };
}

export function DrawingDialog({
  open,
  onOpenChange,
  onSave,
  flowerVariantId,
}) {
  const containerRef = React.useRef(null);
  const imageElementRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const maskCanvasRef = React.useRef(null);
  const imageRef = React.useRef(null);
  const currentStrokeRef = React.useRef(null);
  const isDrawingRef = React.useRef(false);
  const [drawingSize, setDrawingSize] = React.useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = React.useState({ width: 0, height: 0 });
  const [strokes, setStrokes] = React.useState([]);
  const flowerImage = getFlowerVariantById(flowerVariantId).imageSrc;

  const redrawCanvas = React.useCallback(
    (draftStroke = null) => {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const image = imageRef.current;

      if (!canvas || !maskCanvas || !image || !drawingSize.width || !drawingSize.height) {
        return;
      }

      const nextDrawing = {
        width: drawingSize.width,
        height: drawingSize.height,
        strokes: draftStroke ? [...strokes, draftStroke] : strokes,
      };

      renderDrawingToCanvas({
        canvas,
        drawing: nextDrawing,
        image,
        maskCanvas,
      });
    },
    [drawingSize.height, drawingSize.width, strokes],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const image = new Image();
    image.src = flowerImage;
    image.onload = () => {
      imageRef.current = image;
      setDrawingSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
  }, [flowerImage, open]);

  React.useLayoutEffect(() => {
    if (!open || !containerRef.current) {
      return undefined;
    }

    const updateSize = () => {
      setCanvasSize(getCanvasSize(containerRef.current));
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [open]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!canvas || !maskCanvas || !canvasSize.width || !canvasSize.height) {
      return;
    }

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    maskCanvas.width = canvasSize.width;
    maskCanvas.height = canvasSize.height;

    redrawCanvas();
  }, [canvasSize.height, canvasSize.width, redrawCanvas]);

  React.useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  React.useEffect(() => {
    if (open) {
      setStrokes([]);
      currentStrokeRef.current = null;
      isDrawingRef.current = false;
    }
  }, [open]);

  const handlePointerDown = React.useCallback(
    (event) => {
      const canvas = canvasRef.current;

      if (!canvas || !drawingSize.width || !drawingSize.height) {
        return;
      }

      canvas.setPointerCapture(event.pointerId);
      isDrawingRef.current = true;
      currentStrokeRef.current = {
        color: DEFAULT_BRUSH_COLOR,
        size: DEFAULT_BRUSH_SIZE,
        points: [
          getScaledPoint(event, canvas, drawingSize.width, drawingSize.height),
        ],
      };
      redrawCanvas(currentStrokeRef.current);
    },
    [drawingSize.height, drawingSize.width, redrawCanvas],
  );

  const handlePointerMove = React.useCallback(
    (event) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) {
        return;
      }

      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      currentStrokeRef.current.points.push(
        getScaledPoint(event, canvas, drawingSize.width, drawingSize.height),
      );
      redrawCanvas(currentStrokeRef.current);
    },
    [drawingSize.height, drawingSize.width, redrawCanvas],
  );

  const finishStroke = React.useCallback(
    (event) => {
      const canvas = canvasRef.current;

      if (canvas?.hasPointerCapture?.(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      if (currentStrokeRef.current?.points?.length) {
        setStrokes((currentStrokes) => [
          ...currentStrokes,
          currentStrokeRef.current,
        ]);
      }

      currentStrokeRef.current = null;
      isDrawingRef.current = false;
    },
    [],
  );

  const handleClear = React.useCallback(() => {
    currentStrokeRef.current = null;
    setStrokes([]);
  }, []);

  const handleSave = React.useCallback(() => {
    if (!strokes.length || !drawingSize.width || !drawingSize.height) {
      return;
    }

    onSave({
      flowerVariantId,
      width: drawingSize.width,
      height: drawingSize.height,
      strokes,
    });
  }, [drawingSize.height, drawingSize.width, flowerVariantId, onSave, strokes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-4xl overflow-hidden bg-[#F7F0EE]" showCloseButton>
        <DialogHeader className="pb-4">
          <DialogTitle>Desenhe na flor</DialogTitle>
          <DialogDescription>
            Seu desenho fica preso apenas nas partes visiveis da flor.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="pt-0" scrollFade={false}>
          <div
            ref={containerRef}
            className="relative mx-auto aspect-[4/5] w-full max-w-[620px] overflow-hidden rounded-[28px] bg-white/70 shadow-[0_18px_80px_rgba(93,61,57,0.12)]"
          >
            <img
              ref={imageElementRef}
              src={flowerImage}
              alt="Flor para desenhar"
              className="absolute inset-0 h-full w-full object-contain"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
            />
            <canvas ref={maskCanvasRef} className="hidden" aria-hidden="true" />
          </div>
        </DialogPanel>

        <DialogFooter className="bg-transparent px-6 pb-6 pt-4 sm:justify-between" variant="bare">
          <Button size="lg" variant="outline" onClick={handleClear}>
            Limpar
          </Button>
          <Button size="lg" onClick={handleSave} disabled={!strokes.length}>
            Salvar desenho
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
