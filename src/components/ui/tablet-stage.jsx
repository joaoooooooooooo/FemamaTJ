import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

const TABLET_WIDTH = 800;
const TABLET_HEIGHT = 1280;

function getTabletScale() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.max(1, window.innerHeight) / TABLET_HEIGHT;
}

export function TabletStage({ children, background = null, overlay = null, className = "" }) {
  const [scale, setScale] = React.useState(() => getTabletScale());
  const isMobileOrTablet = useMediaQuery("(max-width: 1024px), (any-pointer: coarse)");
  // Fill the viewport height while keeping the canvas and controls at their design size.
  const isProportionalSizingEnabled = !isMobileOrTablet;
  const displayScale = isProportionalSizingEnabled ? scale : 1;
  const stageWidth = isProportionalSizingEnabled
    ? `${TABLET_WIDTH * displayScale}px`
    : "100%";


  React.useLayoutEffect(() => {
    const updateScale = () => {
      setScale(getTabletScale());
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div data-tablet-stage className="relative h-dvh w-full overflow-hidden overscroll-none bg-[#F7F0EE]">
      {background}
      {overlay ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4 sm:p-5">
          {overlay}
        </div>
      ) : null}

      <div
        className="flex h-full min-h-0 min-w-0 items-center justify-center"
      >
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            width: stageWidth,
            height: "100%",
          }}
        >
          <div
            className={`absolute left-0 top-0 overflow-hidden ${background ? "" : "bg-[#F7F0EE]"} ${className}`}
            style={{
              width: isProportionalSizingEnabled ? `${TABLET_WIDTH}px` : "100%",
              height: isProportionalSizingEnabled ? `${TABLET_HEIGHT}px` : "100%",
              transform: isProportionalSizingEnabled
                ? `scale(${displayScale})`
                : "none",
              transformOrigin: "top left",
              "--stage-scale": displayScale,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
