import * as React from "react";
import { renderDrawingToCanvas } from "@/features/drawings/lib/drawing";
import { getFlowerVariantById } from "@/features/drawings/lib/flowerVariants";

export function FlowerDrawingPreview({
  drawing,
  className = "",
  unstyled = false,
}) {
  const canvasRef = React.useRef(null);
  const imageRef = React.useRef(null);
  const flowerImage = getFlowerVariantById(drawing.flowerVariantId).imageSrc;
  const devicePixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

  React.useEffect(() => {
    if (drawing.svgPaths?.length) {
      return undefined;
    }

    const image = new Image();
    image.src = flowerImage;
    image.onload = () => {
      imageRef.current = image;

      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      canvas.width = Math.round(320 * devicePixelRatio);
      canvas.height = Math.round(320 * devicePixelRatio);

      renderDrawingToCanvas({
        canvas,
        drawing,
        image,
        pixelRatio: devicePixelRatio,
      });
    };
  }, [devicePixelRatio, drawing, flowerImage]);

  return (
    <div
      className={`relative aspect-square overflow-hidden ${
        unstyled ? "" : "rounded-[28px] bg-white/80"
      } ${className}`}
    >
      {drawing.imageUrl ? (
        <img
          src={drawing.imageUrl}
          alt="Flor desenhada enviada"
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : null}
      <img
        src={flowerImage}
        alt=""
        className={`absolute inset-0 h-full w-full object-contain ${drawing.imageUrl ? "hidden" : ""}`}
      />
      {drawing.svgPaths?.length ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            WebkitMaskImage: `url(${flowerImage})`,
            WebkitMaskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskImage: `url(${flowerImage})`,
            maskPosition: "center",
            maskRepeat: "no-repeat",
            maskSize: "contain",
          }}
        >
          <svg
            className="h-full w-full"
            viewBox={`0 0 ${drawing.width} ${drawing.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {drawing.svgPaths.map((path, index) => (
              <path
                key={`${index}-${path.d.slice(0, 12)}`}
                d={path.d}
                fill={path.fill ?? "none"}
                stroke={path.stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={path.strokeWidth}
              />
            ))}
          </svg>
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full ${drawing.svgPaths?.length || drawing.imageUrl ? "hidden" : ""}`}
      />
    </div>
  );
}
