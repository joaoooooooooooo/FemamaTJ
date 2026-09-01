import { getFlowerVariantById } from "@/features/drawings/lib/flowerVariants";

export function FlowerTextPreview({
  flower,
  className = "",
  largeTextWordLimit = 2,
  maxFontSize = 14,
  minFontSize = 6,
  unstyled = false,
}) {
  const flowerImage = getFlowerVariantById(flower.flowerVariantId).imageSrc;
  const flowerText = typeof flower.flowerText === "string" ? flower.flowerText : "";
  const trimmedText = flowerText.trim();
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
  const lowerSize = Math.min(minFontSize, maxFontSize);
  const upperSize = Math.max(minFontSize, maxFontSize);
  const characterDensity = Math.min(1, Math.max(0, (trimmedText.length - 10) / 30));
  const wordDensity = Math.min(
    1,
    Math.max(0, (wordCount - largeTextWordLimit) / Math.max(1, 8 - largeTextWordLimit)),
  );
  const textDensity = Math.max(characterDensity, wordDensity);
  const fontSize = upperSize - ((upperSize - lowerSize) * textDensity);

  return (
    <div
      className={`relative aspect-square overflow-visible [container-type:inline-size] ${unstyled ? "" : "rounded-[28px] bg-white/80"} ${className}`}
    >
      <img
        src={flowerImage}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div
        className="pointer-events-none absolute inset-0 z-10"
      >
        <div
          className="absolute inset-[14%] flex items-center justify-center text-center leading-[1.08] text-[#5D3D39]"
          style={{
            fontFamily: "var(--flower)",
            fontSize: `${fontSize}cqi`,
            fontWeight: 400,
          }}
        >
          <span className="max-w-full px-[4%] [overflow-wrap:anywhere]">
            {flowerText || "\u00a0"}
          </span>
        </div>
      </div>
    </div>
  );
}
