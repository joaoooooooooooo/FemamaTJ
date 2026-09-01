import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabletStage } from "@/components/ui/tablet-stage";
import {
  BRUSH_DISPLAY_SIZE,
  DEFAULT_BRUSH_COLOR,
  renderDrawingToCanvas,
} from "@/features/drawings/lib/drawing";
import { getFlowerVariantById } from "@/features/drawings/lib/flowerVariants";

function getCanvasSize(container) {
  return {
    width: container.clientWidth,
    height: container.clientHeight,
  };
}

function getContainFrame(containerWidth, containerHeight, imageWidth, imageHeight) {
  if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) {
    return { width: 0, height: 0 };
  }

  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;

  if (imageAspect > containerAspect) {
    return {
      width: containerWidth,
      height: containerWidth / imageAspect,
    };
  }

  return {
    width: containerHeight * imageAspect,
    height: containerHeight,
  };
}

function getNaturalPoint(event, canvas, drawingWidth, drawingHeight) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * drawingWidth,
    y: ((event.clientY - rect.top) / rect.height) * drawingHeight,
    pressure:
      typeof event.pressure === "number" && event.pressure > 0
        ? event.pressure
        : 0.5,
  };
}

function getNaturalBrushSize(canvas, drawingWidth, brushSize) {
  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !drawingWidth) {
    return brushSize;
  }

  return (brushSize / rect.width) * drawingWidth;
}

export function DrawingPage({ flowerVariantId, onBack, onSave }) {
  const containerRef = React.useRef(null);
  const imageElementRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const currentStrokeRef = React.useRef(null);
  const isDrawingRef = React.useRef(false);
  const [drawingSize, setDrawingSize] = React.useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = React.useState({ width: 0, height: 0 });
  const [strokes, setStrokes] = React.useState([]);
  const [brushDisplaySize, setBrushDisplaySize] = React.useState(BRUSH_DISPLAY_SIZE);
  const [saveError, setSaveError] = React.useState(null);
  const [saveStatus, setSaveStatus] = React.useState("idle");
  const flowerImage = getFlowerVariantById(flowerVariantId).imageSrc;
  const devicePixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const imageFrame = React.useMemo(
    () => getContainFrame(
      canvasSize.width,
      canvasSize.height,
      drawingSize.width,
      drawingSize.height,
    ),
    [canvasSize.height, canvasSize.width, drawingSize.height, drawingSize.width],
  );

  const redrawCanvas = React.useCallback(
    (draftStroke = null) => {
      const canvas = canvasRef.current;
      const image = imageElementRef.current;

      if (!canvas || !image || !image.complete || !drawingSize.width || !drawingSize.height) {
        return;
      }

      renderDrawingToCanvas({
        canvas,
        drawing: {
          width: drawingSize.width,
          height: drawingSize.height,
          strokes: draftStroke ? [...strokes, draftStroke] : strokes,
        },
        image,
        pixelRatio: devicePixelRatio,
      });
    },
    [devicePixelRatio, drawingSize.height, drawingSize.width, strokes],
  );

  React.useLayoutEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const updateSize = () => {
      setCanvasSize(getCanvasSize(containerRef.current));
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !imageFrame.width || !imageFrame.height) {
      return;
    }

    canvas.width = Math.round(imageFrame.width * devicePixelRatio);
    canvas.height = Math.round(imageFrame.height * devicePixelRatio);
    redrawCanvas();
  }, [devicePixelRatio, imageFrame.height, imageFrame.width, redrawCanvas]);

  React.useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handlePointerDown = React.useCallback((event) => {
    const canvas = canvasRef.current;

    if (!canvas || !drawingSize.width || !drawingSize.height) {
      return;
    }

    const point = getNaturalPoint(event, canvas, drawingSize.width, drawingSize.height);

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    currentStrokeRef.current = {
      color: DEFAULT_BRUSH_COLOR,
      size: getNaturalBrushSize(canvas, drawingSize.width, brushDisplaySize),
      points: [point],
    };

    redrawCanvas(currentStrokeRef.current);
  }, [brushDisplaySize, drawingSize.height, drawingSize.width, redrawCanvas]);

  const handlePointerMove = React.useCallback((event) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const moveEvents = event.getCoalescedEvents?.() ?? [event];

    moveEvents.forEach((moveEvent) => {
      currentStrokeRef.current.points.push(
        getNaturalPoint(moveEvent, canvas, drawingSize.width, drawingSize.height),
      );
    });

    redrawCanvas(currentStrokeRef.current);
  }, [drawingSize.height, drawingSize.width, redrawCanvas]);

  const finishStroke = React.useCallback((event) => {
    const canvas = canvasRef.current;
    const completedStroke = currentStrokeRef.current;

    if (canvas?.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (completedStroke?.points?.length) {
      setStrokes((currentStrokes) => [...currentStrokes, completedStroke]);
    }

    currentStrokeRef.current = null;
    isDrawingRef.current = false;
  }, []);

  const handleClear = React.useCallback(() => {
    currentStrokeRef.current = null;
    setStrokes([]);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!strokes.length || !drawingSize.width || !drawingSize.height) {
      return;
    }

    setSaveError(null);
    setSaveStatus("loading");

    const result = await onSave({
      flowerVariantId,
      width: drawingSize.width,
      height: drawingSize.height,
      strokes,
    });

    if (result?.error) {
      setSaveStatus("error");
      setSaveError(result.error.message);
      return;
    }

    setSaveStatus("success");
  }, [drawingSize.height, drawingSize.width, flowerVariantId, onSave, strokes]);

  const handleImageLoad = React.useCallback((event) => {
    const image = event.currentTarget;

    setDrawingSize({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
  }, []);

  return (
    <TabletStage
      overlay={(
        <div className="flex items-start justify-between gap-4">
          <label className="pointer-events-auto flex w-full max-w-xs flex-col gap-2 rounded-2xl bg-white/85 px-4 py-3 text-sm text-[#7B5A56] shadow-[0_12px_36px_rgba(93,61,57,0.08)] backdrop-blur-sm">
            <span className="font-medium text-[#5D3D39]">
              Tamanho do pincel: {brushDisplaySize}px
            </span>
            <input
              type="range"
              min="8"
              max="72"
              step="1"
              value={brushDisplaySize}
              onChange={(event) => setBrushDisplaySize(Number(event.target.value))}
            />
          </label>

          <Button
            size="lg"
            variant="outline"
            onClick={onBack}
            className="pointer-events-auto self-start"
          >
            <ArrowLeft />
            Voltar
          </Button>
        </div>
      )}
    >
      <div className="h-full overflow-y-auto bg-[#F7F0EE] px-6 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-5">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold tracking-[0.22em] text-[#B76E79] uppercase">
                Desenho da flor
              </div>
              <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-[#5D3D39] sm:text-4xl">
                Desenhe na flor
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#7B5A56] sm:text-base">
                Seu desenho fica preso apenas nas partes visiveis da flor.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              <Button size="lg" variant="outline" onClick={handleClear}>
                Limpar
              </Button>
              <Button size="lg" onClick={handleSave} disabled={!strokes.length || saveStatus === "loading"}>
                {saveStatus === "loading" ? "Salvando..." : "Salvar desenho"}
              </Button>
            </div>
          </div>

          {saveError ? (
            <div className="text-sm text-destructive" role="alert">
              {saveError}
            </div>
          ) : null}

          <div>
            <div
              ref={containerRef}
              className="relative mx-auto aspect-[4/5] w-full max-w-[620px] overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="relative"
                  style={{
                    width: imageFrame.width ? `${imageFrame.width}px` : "100%",
                    height: imageFrame.height ? `${imageFrame.height}px` : "100%",
                  }}
                >
                  <img
                    ref={imageElementRef}
                    src={flowerImage}
                    alt="Flor para desenhar"
                    className="pointer-events-none absolute inset-0 h-full w-full select-none"
                    draggable={false}
                    onLoad={handleImageLoad}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 z-10 h-full w-full touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishStroke}
                    onPointerCancel={finishStroke}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabletStage>
  );
}
