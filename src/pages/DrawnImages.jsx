import frameVisibleImage from "@/assets/Frame Visible.svg";
import * as React from "react";
import { Plus, X } from "lucide-react";
import { FlowerTextPreview } from "@/features/drawings/components/FlowerTextPreview";
import { FLOWER_VARIANTS } from "@/features/drawings/lib/flowerVariants";

const FRAME_VIEWBOX = {
  width: 3344,
  height: 2992,
};

const DRAWING_POINTS = [
  { x: 1041.88, y: 625.125 },
  { x: 1329.97, y: 661.01 },
  { x: 1350.89, y: 499.996 },
  { x: 1223.62, y: 299.994 },
  { x: 961.805, y: 299.994 },
  { x: 786.332, y: 465.441 },
  { x: 679.09, y: 994.531 },
  { x: 426.336, y: 854.537 },
  { x: 325.453, y: 1094.53 },
  { x: 103.711, y: 1056.96 },
  { x: 398.164, y: 1274.53 },
  { x: 790.215, y: 1340.31 },
  { x: 1099.08, y: 1278.63 },
  { x: 1106.79, y: 990.891 },
  { x: 1398.16, y: 1140.46 },
  { x: 1467.07, y: 1380.42 },
  { x: 1605.43, y: 966.717 },
  { x: 1667.25, y: 754.537 },
  { x: 1536.34, y: 463.625 },
  { x: 1743.61, y: 523.605 },
  { x: 1798.18, y: 147.932 },
  { x: 2005.43, y: 206.064 },
  { x: 2358.08, y: 99.918 },
  { x: 2376.33, y: 365.441 },
  { x: 2089.07, y: 506.363 },
  { x: 1954.52, y: 685.445 },
  { x: 2110.88, y: 890.893 },
  { x: 1981.82, y: 1051.79 },
  { x: 1839.08, y: 990.326 },
  { x: 2009.06, y: 1360.92 },
  { x: 2194.52, y: 1161.8 },
  { x: 2269.27, y: 1361.79 },
  { x: 2536.33, y: 1387.24 },
  { x: 2565.43, y: 1090.91 },
  { x: 2787.24, y: 1178.52 },
  { x: 2812.69, y: 1503.62 },
  { x: 3190.86, y: 1197.26 },
  { x: 2510.88, y: 566.34 },
  { x: 2639.96, y: 420.662 },
  { x: 2800.88, y: 553.637 },
];

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
  onBack,
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
    setIsAutoPlayEnabled(true);
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

  const animateCameraToPoint = React.useCallback((point, nextScale = null) => {
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
          scale: nextScale ?? currentCamera.scale,
        }));
      });
    });
  }, []);

  React.useEffect(() => {
    if (!drawingTargets.length) {
      return;
    }

    if (lastAutoFocusedDrawingIdRef.current === latestAddedDrawingId) {
      return;
    }

    const latestIndex = latestAddedDrawingId
      ? drawingTargets.findIndex((target) => target.drawing.id === latestAddedDrawingId)
      : 0;
    const nextSelectedIndex = latestIndex >= 0 ? latestIndex : 0;

    lastAutoFocusedDrawingIdRef.current = latestAddedDrawingId ?? null;
    setSelectedDrawingIndex(nextSelectedIndex);
    animateCameraToPoint(drawingTargets[nextSelectedIndex].point, Math.max(camera.scale, 1.45));
  }, [animateCameraToPoint, camera.scale, drawingTargets, latestAddedDrawingId]);

  React.useEffect(() => {
    if (!drawingTargets.length || !drawingTargets[selectedDrawingIndex]) {
      return;
    }

    animateCameraToPoint(
      drawingTargets[selectedDrawingIndex].point,
      Math.max(camera.scale, 1.45),
    );
  }, [animateCameraToPoint, camera.scale, drawingTargets, selectedDrawingIndex]);

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
    <div className="relative h-screen w-screen overflow-hidden bg-[#F7F0EE]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          {isDebugOpen ? (
          <div className="pointer-events-auto rounded-2xl bg-white/85 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between gap-6">
              <div className="text-sm font-medium text-[#5D3D39]">Debug da arvore</div>
              <button
                type="button"
                role="switch"
                aria-checked={isAutoPlayEnabled}
                className="flex items-center gap-2 text-xs font-medium text-[#5D3D39]"
                onClick={() => setIsAutoPlayEnabled((isEnabled) => !isEnabled)}
              >
                Animacao automatica
                <span
                  aria-hidden="true"
                  className={`relative h-5 w-9 rounded-full transition-colors ${isAutoPlayEnabled ? "bg-[#8E4B56]" : "bg-[#D8C1BC]"}`}
                >
                  <span
                    className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${isAutoPlayEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`}
                  />
                </span>
              </button>
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
                    setSelectedDrawingIndex((currentIndex) => (
                      currentIndex + 1 >= drawingTargets.length ? 0 : currentIndex + 1
                    ));
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
                {stressTestDrawings.length ? "Remover teste" : "Popular 40 flores"}
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
                Stress test ativo: 40 flores locais com textos aleatorios.
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
            <button
              type="button"
              className="rounded-xl bg-white/85 px-4 py-3 text-sm font-medium text-[#5D3D39] shadow-sm backdrop-blur-sm"
              onClick={onBack}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="absolute inset-0 overflow-hidden bg-[#F1E7E4]"
      >
        <div
          className="absolute left-0 top-0 will-change-transform"
          style={{
            transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
            transformOrigin: "0 0",
            transition: `transform ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), width ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), height ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
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
    </div>
  );
}

export default DrawnImages;
