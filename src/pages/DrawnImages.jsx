import frameReferenceImage from "@/assets/Frame Ref.svg";
import frameVisibleImage from "@/assets/Frame Visible.png";
import * as React from "react";
import { FlowerDrawingPreview } from "@/features/drawings/components/FlowerDrawingPreview";

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

function DrawnImages({ drawings, onBack }) {
  const visibleDrawings = drawings.slice(0, DRAWING_POINTS.length);
  const [sizeMultiplier, setSizeMultiplier] = React.useState(0.5);

  return (
    <div className="min-h-screen">
      <div
        className="relative mx-auto w-full max-w-6xl"
        style={{ aspectRatio: `${FRAME_VIEWBOX.width} / ${FRAME_VIEWBOX.height}` }}
      >
        <div className="absolute left-4 top-4 z-30 rounded-xl bg-white/85 px-3 py-2 shadow-sm">
          <label className="flex w-40 flex-col gap-2 text-xs text-[#5D3D39]">
            <span>Flower scale: {sizeMultiplier.toFixed(2)}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sizeMultiplier}
              onChange={(event) => setSizeMultiplier(Number(event.target.value))}
            />
          </label>
        </div>

        <img
          src={frameReferenceImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain opacity-0"
        />

        <img
          src={frameVisibleImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
        />

        {visibleDrawings.map((drawing, index) => (
          <div
            key={drawing.id}
            className="absolute z-20"
            style={getPointStyle(DRAWING_POINTS[index], sizeMultiplier)}
          >
            <FlowerDrawingPreview
              drawing={drawing}
              unstyled
              className="h-full w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DrawnImages;
