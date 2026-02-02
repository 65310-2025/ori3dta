import React, { useEffect, useRef } from "react";

import { CP, Point } from "../../types/cp";
import { GridSettings, Mode, MvMode, ViewBox } from "../../types/ui";
import { addEdge, snapVertex } from "../../utils/cpEdit";
import { useDrag } from "./drag";

export const useDrawMode = (
  cp: CP | null,
  setCP: (cp: CP) => void,
  mvMode: MvMode,
  mode: Mode,
  gridSettings: GridSettings,
  viewBox: ViewBox,
) => {
  const pathRef = useRef<SVGPathElement | null>(null);
  const ui = <path ref={pathRef} className={`Edge Edge-${mvMode} Pen-path`} />;

  const onMove = (start: Point, end: Point) => {
    if (cp === null) return;
    const snapStart = snapVertex(cp, start, gridSettings, viewBox);
    const snapEnd = snapVertex(cp, end, gridSettings, viewBox) || end;
    if (snapStart) {
      pathRef.current?.setAttribute(
        "d",
        `M${snapStart.x} ${snapStart.y} L ${snapEnd.x} ${snapEnd.y}`,
      );
    }
  };

  const submit = (start: Point, end: Point) => {
    if (cp === null) return;
    const snapStart = snapVertex(cp, start, gridSettings, viewBox);
    const snapEnd = snapVertex(cp, end, gridSettings, viewBox);
    if (snapStart && snapEnd) {
      setCP(addEdge(cp, snapStart, snapEnd, mvMode));
    }
  };

  const dragHandler = useDrag(onMove, submit, () =>
    pathRef.current?.setAttribute("d", ""),
  );

  useEffect(() => {
    if (mode !== Mode.Drawing) {
      dragHandler.cleanup();
    }
  }, [mode]);

  return { ui, ...dragHandler };
};
