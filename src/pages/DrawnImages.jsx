import frameVisibleImage from "@/assets/Frame Visible02.svg";
import frameRefImage from "@/assets/Frame Ref02.svg";
import * as React from "react";
import { Plus, X } from "lucide-react";
import { FlowerTextPreview } from "@/features/drawings/components/FlowerTextPreview";
import { FLOWER_VARIANTS } from "@/features/drawings/lib/flowerVariants";

const FRAME_VIEWBOX = {
  width: 3026,
  height: 2877,
};

const DRAWING_POINTS = [
  { x: 1572.72, y: 155.98 }, { x: 1610.67, y: 309.5 }, { x: 1721.83, y: 169.598 },
  { x: 1790.41, y: 288.926 }, { x: 1856.31, y: 136.246 }, { x: 2034.17, y: 67.4492 },
  { x: 2136.5, y: 116.191 }, { x: 2066.95, y: 359.316 }, { x: 2037.73, y: 477.988 },
  { x: 2164.89, y: 435.84 }, { x: 2268.61, y: 508.723 }, { x: 2291.95, y: 399.191 },
  { x: 2390.24, y: 428.152 }, { x: 2484.43, y: 477.988 }, { x: 1903.02, y: 440.035 },
  { x: 1871.57, y: 569.082 }, { x: 1755.2, y: 683.656 }, { x: 1631.34, y: 707.73 },
  { x: 1724.83, y: 819.801 }, { x: 1973.05, y: 867.637 }, { x: 2114.28, y: 884.371 },
  { x: 1968.51, y: 1010.59 }, { x: 2114.33, y: 1027.43 }, { x: 2648.98, y: 1068.72 },
  { x: 2466.84, y: 1122.25 }, { x: 2606.84, y: 1185.32 }, { x: 2741.77, y: 1218.48 },
  { x: 2864.98, y: 1195.15 }, { x: 2960.74, y: 1126.82 }, { x: 2499.79, y: 1251.68 },
  { x: 2302.03, y: 1174.02 }, { x: 2203.21, y: 1300.93 }, { x: 2409.6, y: 1337.52 },
  { x: 2514.56, y: 1459.76 }, { x: 2381.95, y: 1442.68 }, { x: 2268.66, y: 1426.01 },
  { x: 2132.28, y: 1412.71 }, { x: 2095.45, y: 1296.76 }, { x: 2007.68, y: 1361.31 },
  { x: 2007.71, y: 1137.58 }, { x: 1775.84, y: 1027.43 }, { x: 1790.47, y: 1172.53 },
  { x: 1498.39, y: 1016.39 }, { x: 1453.87, y: 888.473 }, { x: 1369.48, y: 843.586 },
  { x: 1373.66, y: 713.52 }, { x: 1256.74, y: 676.309 }, { x: 1135.9, y: 709.348 },
  { x: 1044.39, y: 614.949 }, { x: 861.168, y: 584.879 }, { x: 978.941, y: 502.387 },
  { x: 856.992, y: 451.02 }, { x: 701.996, y: 481.125 }, { x: 806.668, y: 332.887 },
  { x: 939.531, y: 352.902 }, { x: 1043.37, y: 288.965 }, { x: 1174.98, y: 477.34 },
  { x: 1307.63, y: 518.551 }, { x: 1700.29, y: 404.621 }, { x: 1632.75, y: 539.184 },
  { x: 1503.33, y: 518.551 },
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
    </div>
  );
}

export default DrawnImages;
