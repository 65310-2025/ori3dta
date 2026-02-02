import React, { useEffect, useState } from "react";

import { GridSettings, ViewBox } from "../../types/ui";

interface GridProps {
  gridSettings: GridSettings;
  viewBox: ViewBox;
}

const Grid: React.FC<GridProps> = ({ gridSettings, viewBox }) => {
  const [lines, setLines] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const newLines: React.ReactElement[] = [];
    const n = gridSettings.gridSize;

    if (n <= 1) return;

    const minGridX = gridSettings.extendGrid ? Math.floor(viewBox.x * n) : 0;
    const minGridY = gridSettings.extendGrid ? Math.floor(viewBox.y * n) : 0;
    const maxGridX = gridSettings.extendGrid
      ? Math.ceil((viewBox.x + 1 / viewBox.zoom) * n)
      : n;
    const maxGridY = gridSettings.extendGrid
      ? Math.ceil((viewBox.y + 1 / viewBox.zoom) * n)
      : n;

    for (let k = minGridX; k <= maxGridX; k++) {
      newLines.push(
        <line
          key={`vx-${k}`}
          x1={k / n}
          y1={minGridY / n}
          x2={k / n}
          y2={maxGridY / n}
          className="grid-line"
        />,
      );
    }

    for (let k = minGridY; k <= maxGridY; k++) {
      newLines.push(
        <line
          key={`hy-${k}`}
          x1={minGridX / n}
          y1={k / n}
          x2={maxGridX / n}
          y2={k / n}
          className="grid-line"
        />,
      );
    }

    setLines(newLines);
  }, [gridSettings, viewBox]);

  return gridSettings.showGrid ? <g className="Grid">{lines}</g> : null;
};

export default Grid;
