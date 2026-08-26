import * as React from "react";
import { renderDrawingToCanvas } from "@/features/drawings/lib/drawing";
import { getFlowerVariantById } from "@/features/drawings/lib/flowerVariants";

export function FlowerDrawingPreview({
  drawing,
  className = "",
  unstyled = false,
}) {
  const canvasRef = React.useRef(null);
  const maskCanvasRef = React.useRef(null);
  const imageRef = React.useRef(null);
  const flowerImage = getFlowerVariantById(drawing.flowerVariantId).imageSrc;

  React.useEffect(() => {
    const image = new Image();
    image.src = flowerImage;
    image.onload = () => {
      imageRef.current = image;

      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      if (!canvas || !maskCanvas) {
        return;
      }

      canvas.width = 320;
      canvas.height = 320;
      maskCanvas.width = 320;
      maskCanvas.height = 320;

      renderDrawingToCanvas({
        canvas,
        drawing,
        image,
        maskCanvas,
      });
    };
  }, [drawing, flowerImage]);

  return (
    <div
      className={`relative aspect-square overflow-hidden ${
        unstyled ? "" : "rounded-[28px] bg-white/80"
      } ${className}`}
    >
      <img
        src={flowerImage}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
      <canvas ref={maskCanvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
