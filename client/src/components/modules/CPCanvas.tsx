import React, { RefObject, useEffect, useRef, useState } from "react";

import { Circle, Line, Rect } from "fabric";
import { Canvas, Point } from "fabric";

import { ClientCPDto } from "../../../../dto/dto";
import { Fold } from "../../types/fold";
import { createEdge, deleteBox } from "../../utils/cpEdit";
import { checkKawasakiVertex } from "../../utils/kawasaki";
import { get, post } from "../../utils/requests";

const SNAP_TOLERANCE = 30; // pixels
const ERROR_CIRCLE_RADIUS = 10; //pixels
const STROKE_WIDTH = 0.004;
const TEMP_STROKE_WIDTH = 0.002;

enum MvMode {
  Mountain = "M",
  Valley = "V",
  Border = "B",
  Aux = "A",
}

enum Mode {
  Default,
  Drawing, // simple line draw
  Selecting, // select, open inspector window
  Deleting, // box delete
  ChangeMV, // box change mv
}

const mode_keys = [" ", "q", "w", "e"] as const;
const mv_keys = ["a", "s", "d", "f"] as const;
type ModeKey = (typeof mode_keys)[number];
type MvKey = (typeof mv_keys)[number];

const mode_map: Record<ModeKey, Mode> = {
  " ": Mode.Drawing,
  q: Mode.Selecting,
  w: Mode.Deleting,
  e: Mode.ChangeMV,
};
const mv_map: Record<MvKey, MvMode> = {
  a: MvMode.Mountain,
  s: MvMode.Valley,
  d: MvMode.Border,
  f: MvMode.Aux,
};

const edge_colors: {
  [key: string]: string;
} = {
  M: "red",
  V: "blue",
  B: "black",
  A: "green",
};

const handleLeftClick = (
  canvas: Canvas,
  modeRef: RefObject<Mode>,
  mvmodeRef: RefObject<MvMode>,
  cpRef: RefObject<Fold | null>,
  setCP: (cp: Fold) => void,
) => {
  let clickStart: [number, number] | null = null;

  const handleMouseDown = (pos: [number, number]) => {
    clickStart = pos;
    console.log("left click down at:", pos);
  };

  const handleMouseMove = (pos: [number, number]) => {
    if (clickStart === null) {
      return;
    }
    const existingTempLine = canvas
      ?.getObjects()
      .find((obj) => obj.strokeWidth === TEMP_STROKE_WIDTH); // all temp objects will be stroke 1
    if (existingTempLine) {
      canvas.remove(existingTempLine); // Remove the existing temporary line or select or delete box
    }
    if (modeRef.current === Mode.Drawing && clickStart) {
      const tempLine = new Line(
        [clickStart[0], clickStart[1], pos[0], pos[1]],
        {
          stroke: edge_colors[mvmodeRef.current] ?? "gray",
          strokeWidth: TEMP_STROKE_WIDTH,
          selectable: false,
          evented: false,
        },
      );

      if (canvas) {
        canvas.add(tempLine); // Add the new temporary line
        canvas.renderAll(); // Render the canvas
      }
    } else if (modeRef.current === Mode.Deleting && clickStart) {
      const tempBox = new Rect({
        left: Math.min(clickStart[0], pos[0]),
        top: Math.min(clickStart[1], pos[1]),
        width: Math.abs(pos[0] - clickStart[0]),
        height: Math.abs(pos[1] - clickStart[1]),
        fill: "rgba(255, 192, 203, 0.3)", // Light pink with transparency
        stroke: "pink",
        strokeWidth: TEMP_STROKE_WIDTH,
        selectable: false,
        evented: false,
      });

      if (canvas) {
        canvas.add(tempBox); // Add the new temporary line
        canvas.renderAll(); // Render the canvas
      }
    } else if (modeRef.current === Mode.Selecting && clickStart) {
      const tempBox = new Rect({
        left: Math.min(clickStart[0], pos[0]),
        top: Math.min(clickStart[1], pos[1]),
        width: Math.abs(pos[0] - clickStart[0]),
        height: Math.abs(pos[1] - clickStart[1]),
        fill: "rgba(144, 238, 144, 0.3)", // Light green with transparency
        stroke: "green",
        strokeWidth: TEMP_STROKE_WIDTH,
        selectable: false,
        evented: false,
      });

      if (canvas) {
        canvas.add(tempBox); // Add the new temporary line
        canvas.renderAll(); // Render the canvas
      }
    }
  };

  const handleMouseUp = (pos: [number, number]) => {
    console.log("left click up at:", pos);
    if (clickStart === null) {
      return;
    }

    if (modeRef.current === Mode.Drawing) {
      // console.log(clickStart,clickEnd,cpRef.current)
      if (cpRef.current) {
        console.log(cpRef.current);
        const output = createEdge(
          cpRef.current,
          clickStart,
          pos,
          mvmodeRef.current == MvMode.Valley
            ? Math.PI
            : mvmodeRef.current == MvMode.Mountain
              ? -Math.PI
              : 0,
          mvmodeRef.current,
          SNAP_TOLERANCE / canvas.getZoom(),
        );
        setCP(output.fold);
      } else {
        console.error("cpRef is null, cannot draw");
      }
    } else if (modeRef.current === Mode.Deleting) {
      if (cpRef.current) {
        setCP(deleteBox(cpRef.current, { min: clickStart, max: pos }));
      } else {
        console.error("cpRef is null, cannot delete");
      }
    } else if (modeRef.current === Mode.Selecting) {
      // TODO: implement this
      console.warn("Selecting mode is not implemented yet");
    }
    clickStart = null;
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp };
};

const makeCanvas = (
  canvaselement: HTMLCanvasElement,
  modeRef: RefObject<Mode>,
  mvmodeRef: RefObject<MvMode>,
  cpRef: RefObject<Fold | null>,
  setCP: (cp: Fold) => void,
) => {
  const canvas = new Canvas(canvaselement, {
    allowTouchScrolling: true,
    backgroundColor: "gray", // TODO: match this with my actual color scheme
    selection: false,
  });

  canvas.zoomToPoint({ x: 0.5, y: 0.5 } as Point, 500);

  const leftHandler = handleLeftClick(canvas, modeRef, mvmodeRef, cpRef, setCP);

  canvas.on("mouse:wheel", function (opt) {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();

    // Zoom factor
    zoom *= 0.999 ** delta;

    // Clamp zoom level
    if (zoom > 2500) zoom = 2500;
    if (zoom < 50) zoom = 50;

    // Zoom to the mouse pointer
    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY } as Point, zoom);

    // Prevent default scrolling behavior
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });

  let isPanning = false;
  let lastPosX = 0;
  let lastPosY = 0;

  canvas.on("mouse:down", function (opt) {
    console.log(opt);
    const evt = opt.e as MouseEvent;
    if (evt.button === 0) {
      const pos = opt.absolutePointer;
      leftHandler.handleMouseDown([pos.x, pos.y]);
    }
    if (evt.altKey || evt.button === 2) {
      evt.preventDefault();
      console.log("right click");
      isPanning = true;
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
    }
  });

  canvas.on("mouse:move", function (opt) {
    if (isPanning) {
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;

      vpt[4] += evt.clientX - lastPosX;
      vpt[5] += evt.clientY - lastPosY;

      canvas.requestRenderAll();

      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
    }
    const pos = opt.absolutePointer;
    leftHandler.handleMouseMove([pos.x, pos.y]);
  });

  canvas.on("mouse:up", function (opt) {
    isPanning = false;
    const evt = opt.e as MouseEvent;
    if (evt.button === 0) {
      const pos = opt.absolutePointer;
      leftHandler.handleMouseUp([pos.x, pos.y]);
    }
  });

  return canvas;
};

const renderCP = (
  cp: Fold,
  canvas: Canvas,
  errorVertices: number[],
  showKawasaki: boolean,
) => {
  const { vertices_coords, edges_vertices, edges_assignment, edges_foldAngle } =
    cp;

  edges_vertices.forEach((edge, index) => {
    const [startIndex, endIndex] = edge;
    const start = vertices_coords[startIndex];
    const end = vertices_coords[endIndex];

    if (start && end) {
      const line = new Line([start[0], start[1], end[0], end[1]], {
        stroke:
          edge_colors[edges_assignment[index] as "M" | "V" | "B"] ?? "green",
        strokeWidth: STROKE_WIDTH,
        selectable: false,
        evented: false,
        opacity:
          edges_assignment[index] === "M"
            ? -edges_foldAngle[index] / Math.PI
            : edges_assignment[index] === "V"
              ? edges_foldAngle[index] / Math.PI
              : 1,
      });
      canvas.add(line);
    }
  });

  if (showKawasaki) {
    errorVertices.forEach((vertexIndex) => {
      const vertex = vertices_coords[vertexIndex];
      const circle = new Circle({
        left: vertex[0] - ERROR_CIRCLE_RADIUS, // Adjust to center the circle
        top: vertex[1] - ERROR_CIRCLE_RADIUS, // Adjust to center the circle
        radius: ERROR_CIRCLE_RADIUS,
        fill: "red",
        selectable: false,
        evented: false,
        opacity: 0.2,
      });
      canvas.add(circle);
    });
  }
};

const CPCanvas: React.FC<{ cpID: string | undefined }> = ({ cpID }) => {
  if (!cpID) {
    return <div>Error: cpID is undefined</div>;
  }
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  const [cp, setCP] = useState<Fold | null>(null);
  const cpRef = useRef<Fold | null>(null);

  useEffect(() => {
    cpRef.current = cp;
  }, [cp]);

  useEffect(() => {
    get(`/api/designs/${cpID}`).then((cp: Fold) => {
      // Expand the CP by filling out redundant fields
      cp.vertices_edges = Array(cp.vertices_coords.length)
        .fill(null)
        .map(() => []);
      cp.vertices_vertices = Array(cp.vertices_coords.length)
        .fill(null)
        .map(() => []);

      cp.edges_vertices.forEach(([start, end], index) => {
        cp.vertices_edges[start].push(index);
        cp.vertices_edges[end].push(index);

        cp.vertices_vertices[start].push(end);
        cp.vertices_vertices[end].push(start);
      });
      console.log(cp);
      setCP(cp);
    });
  }, [cpID]);

  // Initialize FabricJS canvas
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const fabricCanvas = makeCanvas(
      canvasRef.current,
      modeRef,
      mvmodeRef,
      cpRef,
      setCP,
    );
    fabricCanvasRef.current = fabricCanvas;

    const resizeCanvas = () => {
      // Set the FabricJS canvas dimensions to match the parent container
      // (parent of the parent because FabricJS adds a wrapper div around the canvas)
      const parent = canvasRef.current?.parentElement?.parentElement;
      if (parent) {
        console.log(
          "Resizing canvas to parent dimensions:",
          parent.clientWidth,
          parent.clientHeight,
        );
        fabricCanvas.setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      }
    };

    // Initial resize
    resizeCanvas();

    // Resize on window resize
    window.addEventListener("resize", resizeCanvas);

    // Cleanup
    return () => {
      fabricCanvas.dispose();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Handle keyboard shortcuts for changing tool
  const [mode, setMode] = useState(Mode.Default);
  const modeRef = useRef<Mode>(Mode.Default);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const [mvmode, setMvMode] = useState(MvMode.Mountain);
  const mvmodeRef = useRef<MvMode>(MvMode.Mountain);
  useEffect(() => {
    mvmodeRef.current = mvmode;
  }, [mvmode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log("Key pressed:", event.key);
      if (event.key == " ") {
        event.preventDefault();
      }
      console.log(mode_keys, mv_keys);
      if (mode_keys.includes(event.key)) {
        console.log("mode changed to", mode_map[event.key as ModeKey]);
        setMode(mode_map[event.key as ModeKey]);
      }
      if (mv_keys.includes(event.key)) {
        console.log("mv mode changed to", mv_map[event.key as MvKey]);
        setMvMode(mv_map[event.key as MvKey]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    console.log("Current mode:", Mode[mode], "Current MV mode:", mvmode);
  }, [mode, mvmode]);

  const [showKawasaki, setShowKawasaki] = useState(false);
  const showKawasakiRef = useRef<boolean>(false);

  useEffect(() => {
    showKawasakiRef.current = showKawasaki;
  }, [showKawasaki]);

  useEffect(() => {
    if (fabricCanvasRef.current && cp) {
      const fabricCanvas = fabricCanvasRef.current;
      const errors = cp.vertices_coords
        .keys()
        .filter((index) => checkKawasakiVertex(cp, index));
      fabricCanvas.clear();
      console.log("rerendering");
      renderCP(cp, fabricCanvas, Array.from(errors), showKawasaki);
      fabricCanvas.renderAll();
    }
  }, [cp, showKawasaki]);

  useEffect(() => {
    if (cp) {
      const postCP = async () => {
        try {
          // convert cp to interface ClientCPDto
          const cpData: ClientCPDto = {
            vertices_coords: cp.vertices_coords,
            edges_vertices: cp.edges_vertices,
            edges_assignment: cp.edges_assignment,
            edges_foldAngle: cp.edges_foldAngle, // TODO: convert to degrees?
          };
          const response = await post(`/api/designs/${cpID}`, cpData);

          if (!response) {
            console.error("Failed to post CP data");
          } else {
            console.log("CP data successfully posted");
          }
        } catch (error) {
          console.error("Error posting CP data:", error);
        }
      };

      postCP();
    }
  }, [cp]);

  return (
    <div className="w-2/3 h-full">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
};

export default CPCanvas;
