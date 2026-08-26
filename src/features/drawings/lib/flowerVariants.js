import flower1Image from "@/assets/Flower 1.png";
import flower2Image from "@/assets/Flower 2.png";
import flower3Image from "@/assets/Flower 3.png";

export const FLOWER_VARIANTS = [
  {
    id: "flower-1",
    imageSrc: flower1Image,
  },
  {
    id: "flower-2",
    imageSrc: flower2Image,
  },
  {
    id: "flower-3",
    imageSrc: flower3Image,
  },
];

export const DEFAULT_FLOWER_VARIANT_ID = FLOWER_VARIANTS[0].id;

export function getRandomFlowerVariantId() {
  const randomIndex = Math.floor(Math.random() * FLOWER_VARIANTS.length);

  return FLOWER_VARIANTS[randomIndex].id;
}

export function getFlowerVariantById(flowerVariantId) {
  return (
    FLOWER_VARIANTS.find((variant) => variant.id === flowerVariantId)
    ?? FLOWER_VARIANTS[0]
  );
}
