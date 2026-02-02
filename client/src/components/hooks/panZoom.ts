import { useRef, useState } from "react";

import { ViewBox } from "../../types/ui";

interface PanState {
  x: number;
  y: number;
  viewBox: ViewBox;
}

export const useCanvasControls = (initialViewBox: ViewBox) => {
  const [viewBox, setViewBox] = useState(initialViewBox);
  const panStart = useRef<PanState | null>(null);

  const minZoom = 0.1;
  const maxZoom = 100;

  const zoomOnWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const wx = viewBox.x + mx / rect.width / viewBox.zoom;
    const wy = viewBox.y + my / rect.height / viewBox.zoom;

    const newZoom = Math.max(
      Math.min(viewBox.zoom * zoomFactor, maxZoom),
      minZoom,
    );

    setViewBox({
      x: wx - mx / rect.width / newZoom,
      y: wy - my / rect.height / newZoom,
      zoom: newZoom,
    });
  };

  const zoomOnPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button === 1) {
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        viewBox: { ...viewBox },
      };
    }
  };

  const zoomOnPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const curState = panStart.current;
    if (!curState) return;

    const dx = e.clientX - curState.x;
    const dy = e.clientY - curState.y;

    const rect = e.currentTarget.getBoundingClientRect();

    setViewBox((vb) => ({
      ...vb,
      x: curState.viewBox.x - dx / rect.width / vb.zoom,
      y: curState.viewBox.y - dy / rect.height / vb.zoom,
    }));
  };

  const zoomOnPointerUp = () => {
    panStart.current = null;
  };

  return {
    viewBox,
    setViewBox,
    zoomOnWheel,
    zoomOnPointerDown,
    zoomOnPointerMove,
    zoomOnPointerUp,
  };
};
