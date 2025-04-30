import React, { RefObject, useEffect, useRef, useState } from "react";

import { Circle, Line, Rect } from "fabric";
import { Canvas, Point, Polygon} from "fabric";

import { ClientCPDto } from "../../../../dto/dto";
import { Fold } from "../../types/fold";
import { createEdge, deleteBox, findNearestCrease, findNearestVertex } from "../../utils/cpEdit";
import { checkKawasakiVertex } from "../../utils/kawasaki";
import { get, post } from "../../utils/requests";

const SNAP_TOLERANCE = 30;
const STROKE_WIDTH = 4//0.004;
const ERROR_CIRCLE_RADIUS = 10;
const TEMP_STROKE_WIDTH = 0.002;
const CLICK_TOLERANCE = 10;

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
  EditCrease, // select specific crease, change angle
  EditVertex, // select vertex, find the kawasaki crease to add
}

const mode_keys = [" ", "q", "w", "e","g","t"] as const; //TODO: it gets confused if you have caps lock on
const mv_keys = ["a", "s", "d", "f"] as const;
type ModeKey = (typeof mode_keys)[number];
type MvKey = (typeof mv_keys)[number];

const mode_map: Record<ModeKey, Mode> = {
  " ": Mode.Drawing,
  q: Mode.Selecting,
  w: Mode.Deleting,
  e: Mode.ChangeMV,
  // r: radial snapping
  g: Mode.EditCrease,
  t: Mode.EditVertex,
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

const inspector = (
  <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-white p-4 flex" style={{ display: "none", justifyContent: "flex-start", alignItems: "center", gap: "1rem" }}>
    <div className="flex-1">
      <input
        type="text"
        className="w-full p-2 bg-gray-700 text-white rounded"
        placeholder="Set fold angle here..."
        // onChange={(e) => setInspectorText(e.target.value)}
      />
    </div>
    <div className="flex-1">
      <p>Inspector</p>
    </div>
    <div className="flex-2">
    </div>
  </div>
);
const setInspectorText = (text: string) => {
  const inspectorElement = document.querySelector(".fixed.bottom-0.left-0.w-full.bg-gray-800.text-white.p-4.flex");
  if (inspectorElement) {
    const pElement = inspectorElement.querySelector("p");
    if (pElement) {
      pElement.textContent = text;
    }
  }
}
const setInspectorInput = (text: string) => {
  const inspectorElement = document.querySelector(".fixed.bottom-0.left-0.w-full.bg-gray-800.text-white.p-4.flex");
  if (inspectorElement) {
    const inputElement = inspectorElement.querySelector("input");
    if (inputElement) {
      inputElement.value = text;
    }
  }
}
const hideInspector = () => {
  const inspectorElement = document.querySelector(".fixed.bottom-0.left-0.w-full.bg-gray-800.text-white.p-4.flex");
  if (inspectorElement) {
    (inspectorElement as HTMLElement).style.display = "none";
    console.log("inspector hidden")
  }
}
const showInspector = () => {
  const inspectorElement = document.querySelector(".fixed.bottom-0.left-0.w-full.bg-gray-800.text-white.p-4.flex");
  if (inspectorElement) {
    (inspectorElement as HTMLElement).style.display = "flex";
  }
}

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
  // Store the input listeners to remove them later
  const inputListeners = new Map<HTMLInputElement, EventListener>();

  const handleMouseUp = (pos: [number, number],setSelectedCrease:(crease: number | null)=>void, setSelectedVertex:(vertex:number|null)=>void) => {
    // console.log("left click up at:", pos);
    if (clickStart === null) {
      return;
    }
    setSelectedCrease(null)
    setInspectorText("No crease selected")
    setInspectorInput("")
    hideInspector()
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
        const min_:[number,number] = [Math.min(clickStart[0], pos[0]), Math.min(clickStart[1], pos[1])];
        const max_:[number,number] = [Math.max(clickStart[0], pos[0]), Math.max(clickStart[1], pos[1])];
        setCP(deleteBox(cpRef.current, { min: min_, max: max_ }));
      } else {
        console.error("cpRef is null, cannot delete");
      }
    } else if (modeRef.current === Mode.Selecting) {
      // TODO: implement this
      console.warn("Selecting mode is not implemented yet");
    } else if (modeRef.current === Mode.ChangeMV) {
      console.warn("ChangeMV mode is not implemented yet");
    } else if (modeRef.current === Mode.EditCrease) {
      if(cpRef.current){
        const nearestCrease = findNearestCrease(cpRef.current,clickStart,CLICK_TOLERANCE/canvas.getZoom())
        console.log(nearestCrease)
        if (nearestCrease == -1) {
          // setSelectedCrease(null)
          // setInspectorText("No crease selected")
          // setInspectorInput("")
          // hideInspector()
        } else {
          setSelectedCrease(nearestCrease)
          showInspector()
          setInspectorText(`Index: ${nearestCrease}, Assignment: ${cpRef.current.edges_assignment[nearestCrease]} `)
          setInspectorInput(`${cpRef.current.edges_foldAngle[nearestCrease] * 180 / Math.PI}`)

          const inspectorElement = document.querySelector(".fixed.bottom-0.left-0.w-full.bg-gray-800.text-white.p-4.flex");
          if (inspectorElement) {
            const inputElement = inspectorElement.querySelector("input");
            if (inputElement) {
              // If a listener was previously attached, remove it
              const previousListener = inputListeners.get(inputElement);
              if (previousListener) {
                inputElement.removeEventListener("change", previousListener);
              }

              const handleChange = (event: Event) => {
                console.log("input changed", event);
                const newValue = Math.max(-180, Math.min(180, parseFloat((event.target as HTMLInputElement).value)));
                if (!isNaN(newValue) && cpRef.current) {
                  cpRef.current.edges_foldAngle[nearestCrease] = (newValue * Math.PI) / 180;
                  if (newValue > 0) {
                    cpRef.current.edges_assignment[nearestCrease] = "V";
                  }
                  else if (newValue < 0) {
                    cpRef.current.edges_assignment[nearestCrease] = "M";
                  }
                  setCP({ ...cpRef.current });
                }
              };
              inputListeners.set(inputElement, handleChange);
              inputElement.addEventListener("change", handleChange);
            }
          }
        }
      }
    } else if (modeRef.current === Mode.EditVertex) {
      if(cpRef.current){
        const nearestVertex = findNearestVertex(cpRef.current,clickStart,CLICK_TOLERANCE/canvas.getZoom())
        console.log(nearestVertex)
        if (nearestVertex == -1) {
          setSelectedVertex(null)
        }
        else {
          setSelectedVertex(nearestVertex)
        }
      }
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
  setSelectedCrease: (crease: number | null) => void,
  setSelectedVertex: (vertex: number | null) => void,
) => {
  const canvas = new Canvas(canvaselement, {
    allowTouchScrolling: true,
    backgroundColor: "gray", // TODO: match this with my actual color scheme
    selection: false,
  });

  canvas.zoomToPoint({ x: 0.5, y: 0.5 } as Point, 500);

  const leftHandler = handleLeftClick(canvas, modeRef, mvmodeRef, cpRef, setCP,);

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
    canvas.getObjects().forEach((obj) => {
      if (obj.type=== "line"){
        obj.strokeWidth = STROKE_WIDTH/zoom
      }
      else if (obj.type=== "polygon"){
        obj.strokeWidth = 5*STROKE_WIDTH/zoom
      }
      else if (obj instanceof Circle) {
        obj.radius = ERROR_CIRCLE_RADIUS / zoom;
      }

      
    });

    // Prevent default scrolling behavior
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });

  let isPanning = false;
  let lastPosX = 0;
  let lastPosY = 0;

  canvas.on("mouse:down", function (opt) {
    // console.log(opt);
    const evt = opt.e as MouseEvent;
    if (evt.button === 0) {
      const pos = opt.absolutePointer;
      leftHandler.handleMouseDown([pos.x, pos.y]);
    }
    if (evt.altKey || evt.button === 2) {
      evt.preventDefault();
      // console.log("right click");
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
      leftHandler.handleMouseUp([pos.x, pos.y],setSelectedCrease,setSelectedVertex);
    }
  });

  return canvas;
};

const renderCP = (
  cp: Fold,
  canvas: Canvas,
  errorVertices: number[],
  showKawasaki: boolean,
  selectedCrease: number | null,
  selectedVertex: number | null,
) => {
  const { vertices_coords, edges_vertices, edges_assignment, edges_foldAngle } =
    cp;

  if (showKawasaki) {
    errorVertices.forEach((vertexIndex) => {
      const vertex = vertices_coords[vertexIndex];
      const circle = new Circle({
        left: vertex[0]-0.5 - ERROR_CIRCLE_RADIUS/canvas.getZoom(),
        top: vertex[1]-0.5 - ERROR_CIRCLE_RADIUS/canvas.getZoom(),
        radius: ERROR_CIRCLE_RADIUS/canvas.getZoom(),
        fill: "pink",
        selectable: false,
        evented: false,
        opacity: 1,
      });
      canvas.add(circle);
    });
  }
  if (selectedVertex !== null) {
    console.log("selected vertex", selectedVertex);
    const vertex = vertices_coords[selectedVertex];
    const circle = new Circle({
      left: vertex[0]-0.5 - ERROR_CIRCLE_RADIUS/canvas.getZoom(),
      top: vertex[1]-0.5 - ERROR_CIRCLE_RADIUS/canvas.getZoom(),
      radius: ERROR_CIRCLE_RADIUS/canvas.getZoom(),
      fill: "yellow",
      selectable: false,
      evented: false,
      opacity: 1,
    });
    canvas.add(circle);
  }
  if (selectedCrease !== null) {
    const crease = edges_vertices[selectedCrease];
    const start = vertices_coords[crease[0]];
    const end = vertices_coords[crease[1]];
    if (start && end) {
      const line = new Line([start[0], start[1], end[0], end[1]], {
        stroke: "yellow",
        strokeWidth: 5*STROKE_WIDTH/canvas.getZoom(),
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }
  }
  edges_vertices.forEach((edge, index) => {
    const [startIndex, endIndex] = edge;
    const start = vertices_coords[startIndex];
    const end = vertices_coords[endIndex];
    if (start && end) {
      const line = new Line([start[0], start[1], end[0], end[1]], {
        stroke:
          edge_colors[edges_assignment[index] as "M" | "V" | "B"] ?? "green",
        strokeWidth: STROKE_WIDTH/canvas.getZoom(),
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
};

export const CPCanvas: React.FC<{ cpID: string | undefined }> = ({ cpID }) => {
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

  // Fetch the CP data from the server using CPid
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
      setSelectedCrease,
      setSelectedVertex,
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

  // Prevent default space key behavior (scrolling) and handle keyboard shortcuts for changing tool
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key == " ") {
        event.preventDefault();
      }
      // console.log(mode_keys, mv_keys); 
      if (mode_keys.includes(event.key as ModeKey)) {
        setMode(mode_map[event.key as ModeKey]);
        console.log(cpRef.current)
      }
      if (mv_keys.includes(event.key as MvKey)) {
        setMvMode(mv_map[event.key as MvKey]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debugging: log the current mode and mv mode
  useEffect(() => {
    console.log("Current mode:", Mode[mode], "Current MV mode:", mvmode, "zoom", );
  }, [mode, mvmode]);

  const [showKawasaki, setShowKawasaki] = useState(false);
  const showKawasakiRef = useRef<boolean>(false);
  useEffect(() => {
    showKawasakiRef.current = showKawasaki;
  }, [showKawasaki]);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/") {
        setShowKawasaki((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [selectedCrease, setSelectedCrease] = useState<number | null>(null);
  const selectedCreaseRef = useRef<number | null>(null);
  useEffect(() => {
    selectedCreaseRef.current = selectedCrease;
  }, [selectedCrease]);

  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const selectedVertexRef = useRef<number | null>(null);
  useEffect(() => {
    selectedVertexRef.current = selectedVertex;
  }, [selectedVertex]);

  //render cp on canvas
  useEffect(() => {
    if (fabricCanvasRef.current && cp) {
      const fabricCanvas = fabricCanvasRef.current;
      const errors = cp.vertices_coords
        .keys()
        .filter((index) => !checkKawasakiVertex(cp, index));
      fabricCanvas.clear();
      console.log("rerendering");
      renderCP(cp, fabricCanvas, Array.from(errors), showKawasaki,selectedCrease,selectedVertex);
      fabricCanvas.renderAll();
    }
  }, [cp, showKawasaki,selectedCrease,selectedVertex]);

  //post
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
      {inspector}
    </div>
  );
};


