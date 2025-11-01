import { useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type ResizeEdge =
  | "north"
  | "south"
  | "east"
  | "west"
  | "north-east"
  | "north-west"
  | "south-east"
  | "south-west";

const MIN_WIDTH = 800;
const MIN_HEIGHT = 513;
const edgeCursorMap: Record<ResizeEdge, string> = {
  north: "ns-resize",
  south: "ns-resize",
  east: "ew-resize",
  west: "ew-resize",
  "north-east": "nesw-resize",
  "south-east": "nwse-resize",
  "north-west": "nwse-resize",
  "south-west": "nesw-resize",
};

const edgeConfigs: Array<{
  edge: ResizeEdge;
  className: string;
}> = [
  { edge: "north", className: "top-0 left-4 right-4 h-2" },
  { edge: "south", className: "bottom-0 left-4 right-4 h-2" },
  { edge: "east", className: "right-0 top-4 bottom-4 w-2" },
  { edge: "west", className: "left-0 top-4 bottom-4 w-2" },
  { edge: "north-east", className: "top-0 right-0 h-4 w-4" },
  { edge: "north-west", className: "top-0 left-0 h-4 w-4" },
  { edge: "south-east", className: "bottom-0 right-0 h-4 w-4" },
  { edge: "south-west", className: "bottom-0 left-0 h-4 w-4" },
];

const clamp = (value: number, minimum: number) =>
  value < minimum ? minimum : value;

export const WindowResizeHandles = () => {
  const startResize = useCallback(
    async (
      edge: ResizeEdge,
      event: ReactPointerEvent<HTMLDivElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();

      const startBounds = await window.electron.getWindowBounds();
      if (!startBounds) return;

      const startX = event.screenX;
      const startY = event.screenY;
      let animationFrame: number | null = null;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (animationFrame != null) {
          cancelAnimationFrame(animationFrame);
        }

        animationFrame = requestAnimationFrame(() => {
          const deltaX = moveEvent.screenX - startX;
          const deltaY = moveEvent.screenY - startY;

          let { x, y, width, height } = startBounds;

          const affectsNorth = edge.includes("north");
          const affectsSouth = edge.includes("south");
          const affectsEast = edge.includes("east");
          const affectsWest = edge.includes("west");

          if (affectsEast) {
            width = clamp(startBounds.width + deltaX, MIN_WIDTH);
          }

          if (affectsSouth) {
            height = clamp(startBounds.height + deltaY, MIN_HEIGHT);
          }

          if (affectsWest) {
            const proposedWidth = startBounds.width - deltaX;
            const nextWidth = clamp(proposedWidth, MIN_WIDTH);
            const consumedDelta = startBounds.width - nextWidth;
            width = nextWidth;
            x = Math.round(startBounds.x + consumedDelta);
          }

          if (affectsNorth) {
            const proposedHeight = startBounds.height - deltaY;
            const nextHeight = clamp(proposedHeight, MIN_HEIGHT);
            const consumedDelta = startBounds.height - nextHeight;
            height = nextHeight;
            y = Math.round(startBounds.y + consumedDelta);
          }

          window.electron.setWindowBounds({
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
          });
        });
      };

      const cleanup = () => {
        if (animationFrame != null) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        document.body.style.cursor = "";
      };

      const handlePointerUp = () => {
        cleanup();
      };

      document.body.style.cursor = edgeCursorMap[edge];
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp, { once: true });
    },
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {edgeConfigs.map(({ edge, className }) => (
        <div
          key={edge}
          className={`pointer-events-auto absolute ${className}`}
          style={{
            cursor: edgeCursorMap[edge],
            WebkitAppRegion: "none",
          }}
          onPointerDown={(event) => void startResize(edge, event)}
          data-edge={edge}
        />
      ))}
    </div>
  );
};
