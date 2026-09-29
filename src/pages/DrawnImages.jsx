import { SponsorPanel } from "@/components/ui/sponsor-panel";
import frameVisibleImage from "@/assets/Frame Visible02.svg";
import frameRefImage from "@/assets/Frame Ref02.svg";
import * as React from "react";
import { Alignment, Fit, Layout, useRive } from "@rive-app/react-webgl2";
import fase1Rive from "@/assets/Fase1.riv?url";
import { Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { FlowerTextPreview } from "@/features/drawings/components/FlowerTextPreview";
import { DRAWING_POINTS } from "@/features/drawings/lib/tree-layout";
import { FLOWER_VARIANTS } from "@/features/drawings/lib/flowerVariants";

const TreeBackground = React.memo(function TreeBackground() {
  const { RiveComponent } = useRive({
    src: fase1Rive,
    artboard: "Bg Tree",
    stateMachines: "BG Tree",
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
  });

  return (
    <div data-tree-background aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <RiveComponent className="h-full w-full" />
    </div>
  );
});

const FRAME_VIEWBOX = {
  width: 3026,
  height: 2877,
};

const BASE_SLOT_SIZE = 0.0395;
const AUTO_PLAY_PAUSE_MS = 1500;
const STRESS_TEST_WORDS = [
  "amor",
  "carinho",
  "coragem",
  "cuidado",
  "esperanca",
  "familia",
  "forca",
  "futuro",
  "juntos",
  "luz",
  "vida",
];
const INITIAL_CAMERA = {
  x: 0.5,
  y: 0.5,
  scale: 1.15,
};

function getPointStyle(point, sizeMultiplier) {
  const slotSize = BASE_SLOT_SIZE * FRAME_VIEWBOX.width * sizeMultiplier;

  return {
    left: `${(point.x / FRAME_VIEWBOX.width) * 100}%`,
    top: `${(point.y / FRAME_VIEWBOX.height) * 100}%`,
    width: `${slotSize}px`,
    height: `${slotSize}px`,
    transform: "translate(-50%, -50%)",
  };
}

function getRandomIndex(length) {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0];

  return randomValue % length;
}

function createStressTestDrawings() {
  return DRAWING_POINTS.map((_, index) => {
    const wordCount = 2 + getRandomIndex(5);
    const flowerText = Array.from(
      { length: wordCount },
      () => STRESS_TEST_WORDS[getRandomIndex(STRESS_TEST_WORDS.length)],
    ).join(" ").slice(0, 40).trim();

    return {
      createdAt: new Date(Date.now() - (index * 1000)).toISOString(),
      flowerText,
      flowerVariantId: FLOWER_VARIANTS[getRandomIndex(FLOWER_VARIANTS.length)].id,
      id: `stress-${crypto.randomUUID()}`,
      source: "stress-test",
    };
  });
}

function DrawnImages({
  drawings,
  error,
  isLoading,
  isRemote = false,
  latestAddedDrawingId,
  onClearAll,
  onRefresh,
}) {
  const [sizeMultiplier, setSizeMultiplier] = React.useState(0.5);
  const viewportRef = React.useRef(null);
  const animationFrameRef = React.useRef(0);
  const lastAutoFocusedDrawingIdRef = React.useRef(null);
  const [viewportSize, setViewportSize] = React.useState({ width: 0, height: 0 });
  const [camera, setCamera] = React.useState(INITIAL_CAMERA);
  const [transitionDurationMs, setTransitionDurationMs] = React.useState(2800);
  const [selectedDrawingIndex, setSelectedDrawingIndex] = React.useState(0);
  const [isDebugOpen, setIsDebugOpen] = React.useState(false);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = React.useState(true);
  const [stressTestDrawings, setStressTestDrawings] = React.useState([]);
  const [minFlowerFontSize, setMinFlowerFontSize] = React.useState(6);
  const [maxFlowerFontSize, setMaxFlowerFontSize] = React.useState(14);
  const [largeTextWordLimit, setLargeTextWordLimit] = React.useState(2);
  const visibleDrawings = React.useMemo(
    () => (stressTestDrawings.length ? stressTestDrawings : drawings)
      .slice(0, DRAWING_POINTS.length),
    [drawings, stressTestDrawings],
  );

  const drawingTargets = React.useMemo(
    () => visibleDrawings.map((drawing, index) => ({
      drawing,
      point: DRAWING_POINTS[index],
    })).filter((target) => Boolean(target.point)),
    [visibleDrawings],
  );

  function toggleStressTest() {
    setSelectedDrawingIndex(0);

    if (stressTestDrawings.length) {
      setStressTestDrawings([]);
      return;
    }

    setStressTestDrawings(createStressTestDrawings());
  }

  React.useLayoutEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    const updateViewportSize = () => {
      setViewportSize({
        width: viewportRef.current.clientWidth,
        height: viewportRef.current.clientHeight,
      });
    };

    updateViewportSize();

    const observer = new ResizeObserver(updateViewportSize);
    observer.observe(viewportRef.current);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const animateCameraToPoint = React.useCallback((point) => {
    if (!point) {
      return;
    }

    const x = point.x / FRAME_VIEWBOX.width;
    const y = point.y / FRAME_VIEWBOX.height;

    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        setCamera((currentCamera) => ({
          ...currentCamera,
          x,
          y,
          scale: Math.max(currentCamera.scale, 1.45),
        }));
      });
    });
  }, []);

  React.useEffect(() => {
    if (!isAutoPlayEnabled || !drawingTargets.length) {
      return;
    }

    const latestFocusId = latestAddedDrawingId ?? drawingTargets[0].drawing.id;
    if (lastAutoFocusedDrawingIdRef.current === latestFocusId) {
      return;
    }

    const latestIndex = drawingTargets.findIndex((target) => target.drawing.id === latestFocusId);
    const nextSelectedIndex = latestIndex >= 0 ? latestIndex : 0;

    lastAutoFocusedDrawingIdRef.current = latestFocusId;
    setSelectedDrawingIndex(nextSelectedIndex);
  }, [isAutoPlayEnabled, drawingTargets, latestAddedDrawingId]);

  const selectedTarget = drawingTargets[selectedDrawingIndex];
  const selectedTargetId = selectedTarget?.drawing.id;
  const selectedTargetX = selectedTarget?.point.x;
  const selectedTargetY = selectedTarget?.point.y;

  React.useEffect(() => {
    if (!isAutoPlayEnabled || selectedTargetX === undefined || selectedTargetY === undefined) {
      return;
    }

    animateCameraToPoint({ x: selectedTargetX, y: selectedTargetY });
    return () => window.cancelAnimationFrame(animationFrameRef.current);
  }, [animateCameraToPoint, isAutoPlayEnabled, selectedTargetId, selectedTargetX, selectedTargetY]);

  React.useEffect(() => {
    if (!isAutoPlayEnabled || drawingTargets.length < 2) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSelectedDrawingIndex((currentIndex) => (
        currentIndex + 1 >= drawingTargets.length ? 0 : currentIndex + 1
      ));
    }, transitionDurationMs + AUTO_PLAY_PAUSE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [drawingTargets.length, isAutoPlayEnabled, selectedDrawingIndex, transitionDurationMs]);

  const baseScale = Math.min(
    viewportSize.width / FRAME_VIEWBOX.width || 0,
    viewportSize.height / FRAME_VIEWBOX.height || 0,
  );
  const scaledFrameWidth = FRAME_VIEWBOX.width * baseScale * camera.scale;
  const scaledFrameHeight = FRAME_VIEWBOX.height * baseScale * camera.scale;
  const translateX =
    (viewportSize.width / 2) - (camera.x * scaledFrameWidth);
  const translateY =
    (viewportSize.height / 2) - (camera.y * scaledFrameHeight);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#F7F0EE]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          {isDebugOpen ? (
          <div className="pointer-events-auto rounded-2xl bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between gap-6">
              <div className="text-sm font-medium text-[#5D3D39]">Debug da arvore</div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#5D3D39]">
                Animação automática
                <Switch checked={isAutoPlayEnabled} onCheckedChange={setIsAutoPlayEnabled} />
              </label>
            </div>
            {isRemote ? (
              <div className="mt-1 text-xs text-[#7E5F59]">
                Arvore online conectada ao Forminit
              </div>
            ) : null}
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
                <span>Escala da flor: {sizeMultiplier.toFixed(2)}</span>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.01"
                  value={sizeMultiplier}
                  onChange={(event) => setSizeMultiplier(Number(event.target.value))}
                />
              </label>
              <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
                <span>Escala da moldura: {camera.scale.toFixed(2)}</span>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.01"
                  value={camera.scale}
                  onChange={(event) => {
                    const scale = Number(event.target.value);
                    setCamera((currentCamera) => ({ ...currentCamera, scale }));
                  }}
                />
              </label>
              <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
                <span>Eixo X: {camera.x.toFixed(2)}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={camera.x}
                  onChange={(event) => {
                    const x = Number(event.target.value);
                    setCamera((currentCamera) => ({ ...currentCamera, x }));
                  }}
                />
              </label>
              <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
                <span>Eixo Y: {camera.y.toFixed(2)}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={camera.y}
                  onChange={(event) => {
                    const y = Number(event.target.value);
                    setCamera((currentCamera) => ({ ...currentCamera, y }));
                  }}
                />
              </label>
              <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
                <span>Velocidade: {transitionDurationMs}ms</span>
                <input
                  type="range"
                  min="300"
                  max="12000"
                  step="50"
                  value={transitionDurationMs}
                  onChange={(event) => setTransitionDurationMs(Number(event.target.value))}
                />
              </label>
              <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
                <span>Fonte minima: {minFlowerFontSize.toFixed(1)}</span>
                <input
                  type="range"
                  min="3"
                  max="14"
                  step="0.5"
                  value={minFlowerFontSize}
                  onChange={(event) => setMinFlowerFontSize(Number(event.target.value))}
                />
              </label>
              <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
                <span>Fonte maxima: {maxFlowerFontSize.toFixed(1)}</span>
                <input
                  type="range"
                  min="8"
                  max="24"
                  step="0.5"
                  value={maxFlowerFontSize}
                  onChange={(event) => setMaxFlowerFontSize(Number(event.target.value))}
                />
              </label>
              <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
                <span>Texto curto: ate {largeTextWordLimit} palavras</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={largeTextWordLimit}
                  onChange={(event) => setLargeTextWordLimit(Number(event.target.value))}
                />
              </label>
            </div>

            {drawingTargets.length ? (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl bg-[#5D3D39] px-4 py-2 text-sm font-medium text-white"
                  onClick={() => {
                    const nextIndex = (selectedDrawingIndex + 1) % drawingTargets.length;
                    setSelectedDrawingIndex(nextIndex);
                    animateCameraToPoint(drawingTargets[nextIndex].point);
                  }}
                >
                  Flor atualizada anterior
                </button>
                <div className="text-xs text-[#7E5F59]">
                  Focando flor salva {selectedDrawingIndex + 1} de {drawingTargets.length}
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${stressTestDrawings.length ? "border-[#8E4B56] bg-[#8E4B56] text-white" : "border-[#D8C1BC] bg-white text-[#5D3D39]"}`}
                onClick={toggleStressTest}
              >
                {stressTestDrawings.length ? "Remover teste" : `Popular ${DRAWING_POINTS.length} flores`}
              </button>
              {isRemote ? (
                <button
                  type="button"
                  className="rounded-xl border border-[#D8C1BC] bg-white px-4 py-2 text-sm font-medium text-[#5D3D39]"
                  onClick={onRefresh}
                >
                  Atualizar arvore
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-xl border border-[#D8C1BC] bg-white px-4 py-2 text-sm font-medium text-[#8E4B56]"
                  onClick={onClearAll}
                >
                  Apagar todas as flores
                </button>
              )}
            </div>

            {stressTestDrawings.length ? (
              <div className="mt-3 text-xs font-medium text-[#8E4B56]">
                Stress test ativo: {stressTestDrawings.length} flores locais com textos aleatorios.
              </div>
            ) : null}

            {isLoading ? (
              <div className="mt-3 text-xs text-[#7E5F59]">
                Carregando flores da arvore...
              </div>
            ) : null}

            {error ? (
              <div className="mt-3 text-xs text-destructive">
                {error}
              </div>
            ) : null}
          </div>
          ) : <div />}

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-[#5D3D39] shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
              aria-expanded={isDebugOpen}
              aria-label={isDebugOpen ? "Fechar controles da arvore" : "Abrir controles da arvore"}
              onClick={() => setIsDebugOpen((isOpen) => !isOpen)}
            >
              {isDebugOpen ? <X className="size-4" /> : <Plus className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="absolute inset-0 overflow-hidden bg-[#F1E7E4]"
      >
        {/* The background fills the viewport independently of the tree camera. */}
        <TreeBackground />
        <div
          data-tree-camera
          className="absolute left-0 top-0 z-10 will-change-transform"
          style={{
            transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
            transformOrigin: "0 0",
            transition: isAutoPlayEnabled
              ? `transform ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), width ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), height ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
              : "none",
            width: `${scaledFrameWidth}px`,
            height: `${scaledFrameHeight}px`,
          }}
        >
          <img
            src={frameVisibleImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          />

          <img
            src={frameRefImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 h-full w-full opacity-0"
          />

          {visibleDrawings.map((drawing, index) => (
            <div
              key={drawing.id}
              className="absolute z-20"
              style={getPointStyle(DRAWING_POINTS[index], sizeMultiplier)}
            >
              <FlowerTextPreview
                flower={drawing}
                largeTextWordLimit={largeTextWordLimit}
                maxFontSize={maxFlowerFontSize}
                minFontSize={minFlowerFontSize}
                unstyled
                className="h-full w-full"
              />
            </div>
          ))}
        </div>
      </div>
      <SponsorPanel placement="tree" />
    </div>
  );
}

export default DrawnImages;
