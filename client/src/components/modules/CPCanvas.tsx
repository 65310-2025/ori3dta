import React, { useLayoutEffect, useRef, useState } from "react";

import {
  CIRCLE_RADIUS,
  modeIcons,
  modeKeys,
  modeMap,
  mvKeys,
  mvMap,
} from "../../constants/editor";
import { CP, Edge, Point } from "../../types/cp";
import {
  GridSettings,
  Mode,
  MvMode,
  ViewBox,
  defaultGridSettings,
} from "../../types/ui";
import { getSnapPoints } from "../../utils/cpEdit";
import { useChangeMvMode } from "../hooks/changeMvMode";
import { useDeleteMode } from "../hooks/deleteMode";
import { useDrawMode } from "../hooks/drawMode";
import { useModeSwitcher } from "../hooks/modeSwitcher";
import { useCanvasControls } from "../hooks/panZoom";
import { useSelectMode } from "../hooks/selectMode";
import "./CPCanvas.css";
import EdgeContextMenu from "./EdgeContextMenu";
import Grid from "./Grid";
import GridMenu from "./GridMenu";

const renderCP = (
  cp: CP,
  viewBox: ViewBox,
  selection: string[],
  edgeOnClick: (
    edge: Edge,
  ) => (event: React.PointerEvent<SVGPathElement>) => void,
  mode: Mode,
  gridSettings: GridSettings,
) => {
  const vertices =
    mode === Mode.Drawing
      ? getSnapPoints(cp, gridSettings, viewBox)
      : cp.vertices;
  const verticesComponents = vertices.map((v: Point, idx: number) => {
    return (
      <circle
        cx={v.x}
        cy={v.y}
        r={Math.min(CIRCLE_RADIUS / viewBox.zoom, CIRCLE_RADIUS / 1.5)}
        className="CP-vertex"
        key={`vertex-${idx}`}
      />
    );
  });

  const getOpacity = (e: Edge) => {
    if (e.assignment === "V" || e.assignment === "M") {
      return Math.abs(e.foldAngle) / Math.PI;
    }
    return 1;
  };

  const edges = cp.edges.map((e: Edge) => {
    return (
      <g key={`edge-${e.id}`}>
        <path
          className={`Edge Edge-${e.assignment} ${selection.includes(e.id) ? "Edge-selected" : ""}`}
          d={`M${e.vertex1.x} ${e.vertex1.y} L${e.vertex2.x} ${e.vertex2.y}`}
          style={{ strokeOpacity: getOpacity(e) }}
        />
        <path
          className="Edge-wrap"
          d={`M${e.vertex1.x} ${e.vertex1.y} L${e.vertex2.x} ${e.vertex2.y}`}
          onPointerDown={edgeOnClick(e)}
        />
      </g>
    );
  });

  return [...edges, ...verticesComponents];
};

export interface CPCanvasProps {
  cp: CP | null;
  setCP: (cp: CP) => void;
}

const CPCanvas: React.FC<CPCanvasProps> = ({ cp, setCP }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const {
    viewBox,
    zoomOnWheel,
    zoomOnPointerDown,
    zoomOnPointerMove,
    zoomOnPointerUp,
  } = useCanvasControls({ x: -0.25, y: -0.25, zoom: 1 / 1.5 });
  const {
    mode,
    setMode,
    handleKeyDown: modeOnKeyDown,
  } = useModeSwitcher<Mode>(modeKeys, modeMap, Mode.Selecting);
  const {
    mode: mvMode,
    setMode: setMvMode,
    handleKeyDown: mvModeOnKeyDown,
  } = useModeSwitcher<MvMode>(mvKeys, mvMap, MvMode.Mountain);
  const {
    selection,
    setSelection,
    edgeOnClick: selectEdgeOnClick,
  } = useSelectMode(mode);
  const [gridSettings, setGridSettings] =
    useState<GridSettings>(defaultGridSettings);

  const {
    ui: drawUi,
    onPointerDown: drawOnPointerDown,
    onPointerMove: drawOnPointerMove,
    onPointerUp: drawOnPointerUp,
    onKeyDown: drawOnKeyDown,
  } = useDrawMode(cp, setCP, mvMode, mode, gridSettings, viewBox);
  const {
    ui: deleteUi,
    onPointerDown: deleteOnPointerDown,
    onPointerMove: deleteOnPointerMove,
    onPointerUp: deleteOnPointerUp,
    onKeyDown: deleteOnKeyDown,
  } = useDeleteMode(cp, setCP, mode);
  const {
    ui: changeMvUi,
    onPointerDown: changeMvOnPointerDown,
    onPointerMove: changeMvOnPointerMove,
    onPointerUp: changeMvOnPointerUp,
    onKeyDown: changeMvOnKeyDown,
    edgeOnClick: changeMvEdgeOnClick,
  } = useChangeMvMode(cp, setCP, mode);

  useLayoutEffect(() => {
    if (!editorRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setWidth(width);
      setHeight(height);
    });
    observer.observe(editorRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    zoomOnPointerDown(e);
    if (mode === Mode.Drawing) {
      drawOnPointerDown(e);
    } else if (mode === Mode.Deleting) {
      deleteOnPointerDown(e);
    } else if (mode === Mode.ChangeMV) {
      changeMvOnPointerDown(e);
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    zoomOnPointerMove(e);
    if (mode === Mode.Drawing) {
      drawOnPointerMove(e);
    } else if (mode === Mode.Deleting) {
      deleteOnPointerMove(e);
    } else if (mode === Mode.ChangeMV) {
      changeMvOnPointerMove(e);
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    zoomOnPointerUp();
    if (mode === Mode.Drawing) {
      drawOnPointerUp(e);
    } else if (mode === Mode.Deleting) {
      deleteOnPointerUp(e);
    } else if (mode === Mode.ChangeMV) {
      changeMvOnPointerUp(e);
    }
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    zoomOnWheel(e);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    modeOnKeyDown(e);
    if (mode === Mode.Drawing) {
      mvModeOnKeyDown(e);
      drawOnKeyDown(e);
    } else if (mode === Mode.Deleting) {
      deleteOnKeyDown(e);
    } else if (mode === Mode.ChangeMV) {
      changeMvOnKeyDown(e);
    }
  };

  const icons = Object.values(Mode).map((m) => {
    return (
      <button key={m} onClick={() => setMode(m)}>
        <img
          src={modeIcons[m]}
          className={`Editor-canvas-toolbar-icon-${m === mode ? "active" : "inactive"} Editor-canvas-modeIcon`}
        />
      </button>
    );
  });

  const mvIcons = Object.values(MvMode).map((m) => {
    return (
      <button key={m} onClick={() => setMvMode(m)}>
        <div
          className={`Editor-canvas-toolbar-icon-${m === mvMode ? "active" : "inactive"} Editor-canvas-mvIcon`}
          id={`MvIcon-${m}`}
        >
          {m}
        </div>
      </button>
    );
  });

  const edgeOnClick = (e: Edge) => {
    return (event: React.PointerEvent<SVGPathElement>) => {
      if (mode === Mode.Selecting) {
        selectEdgeOnClick(event, e);
      } else if (mode === Mode.ChangeMV) {
        changeMvEdgeOnClick(event, e);
      }
    };
  };

  const getViewBox = () => {
    if (width > height) {
      return `${viewBox.x} ${viewBox.y} ${1 / viewBox.zoom} ${(1 / viewBox.zoom / width) * height}`;
    }
    return `${viewBox.x} ${viewBox.y} ${(1 / viewBox.zoom / height) * width} ${1 / viewBox.zoom}`;
  };

  return (
    <div className="Editor-canvas-wrap" tabIndex={1} onKeyDown={onKeyDown}>
      <div className="Canvas-sidebar">
        <GridMenu
          gridSettings={gridSettings}
          setGridSettings={setGridSettings}
        />
        <EdgeContextMenu
          selection={selection}
          cp={cp}
          setCP={setCP}
          setSelection={setSelection}
        />
      </div>
      <div className="Canvas-toolbar-wrap">
        <div className="Editor-canvas-toolbar" id="Mode-toolbar">
          {icons}
        </div>
        <div className="Canvas" ref={editorRef}>
          <svg
            width={width}
            height={height}
            viewBox={getViewBox()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={onWheel}
          >
            <g className="CP">
              {cp &&
                renderCP(
                  cp,
                  viewBox,
                  selection,
                  edgeOnClick,
                  mode,
                  gridSettings,
                )}
            </g>
            {drawUi}
            {deleteUi}
            {changeMvUi}
            <Grid gridSettings={gridSettings} viewBox={viewBox} />
          </svg>
          <div className="Editor-canvas-toolbar" id="MvMode-toolbar">
            {mode === Mode.Drawing ? mvIcons : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPCanvas;
