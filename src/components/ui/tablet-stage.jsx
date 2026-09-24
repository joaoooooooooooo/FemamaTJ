import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";

const TABLET_WIDTH = 800;
const TABLET_HEIGHT = 1280;
const VIEWPORT_PADDING = 16;

function getTabletScale() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(
    1,
    (window.innerWidth - (VIEWPORT_PADDING * 2)) / TABLET_WIDTH,
    (window.innerHeight - (VIEWPORT_PADDING * 2)) / TABLET_HEIGHT,
  );
}

export function TabletStage({ children, overlay = null, className = "" }) {
  const [scale, setScale] = React.useState(() => getTabletScale());
  const isMobileOrTablet = useMediaQuery("(max-width: 1024px), (any-pointer: coarse)");
  const [isDesktopProportionEnabled, setIsDesktopProportionEnabled] =
    React.useState(true);
  const isProportionalSizingEnabled = !isMobileOrTablet && isDesktopProportionEnabled;
  const displayScale = isProportionalSizingEnabled ? scale : 1;
  const stageWidth = isProportionalSizingEnabled
    ? `${TABLET_WIDTH * displayScale}px`
    : "100%";
  const stageHeight = isProportionalSizingEnabled
    ? `${TABLET_HEIGHT * displayScale}px`
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
    <div data-tablet-stage className="relative h-dvh w-full overflow-hidden overscroll-none bg-[#EDE2DF]">
      {!isMobileOrTablet ? (
      <label className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-full border border-[#D8C1BC]/80 bg-[#FBFAFA]/90 px-2.5 py-1.5 text-xs font-medium text-[#5D3D39] shadow-sm backdrop-blur-sm">
        <span>Proporção</span>
        <Switch
          checked={isProportionalSizingEnabled}
          onCheckedChange={setIsDesktopProportionEnabled}
        />
      </label>
      ) : null}

      {overlay ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4 sm:p-5">
          {overlay}
        </div>
      ) : null}

      <div
        className={`flex h-full min-h-0 min-w-0 items-center justify-center ${isProportionalSizingEnabled ? "p-4" : "p-0"}`}
      >
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            width: stageWidth,
            height: stageHeight,
          }}
        >
          <div
            className={`absolute left-0 top-0 overflow-hidden bg-[#F7F0EE] ${className}`}
            style={{
              width: isProportionalSizingEnabled ? `${TABLET_WIDTH}px` : "100%",
              height: isProportionalSizingEnabled ? `${TABLET_HEIGHT}px` : "100%",
              transform: isProportionalSizingEnabled
                ? `scale(${displayScale})`
                : "none",
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
