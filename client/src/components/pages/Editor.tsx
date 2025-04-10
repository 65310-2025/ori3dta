import React, {
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { googleLogout } from "@react-oauth/google";
import { Button, Menu, Spin } from "antd";
import type { MenuProps } from "antd";
import { Line } from "fabric";
import { Canvas } from "fabric";
import { Fold } from "../../types/fold";
import { useNavigate, useParams } from "react-router-dom";

import { ServerCPDto, ClientCPDto } from "../../../../dto/dto";
import LibraryIcon from "../../assets/icons/library.svg";
import { get, post } from "../../utils/requests";
import { UserContext } from "../App";

import { createEdge } from "../../utils/cpEdit"

const SNAP_TOLERANCE = 10; // pixels
const SCROLL_RATE = 0.05;

enum Mode {
  Default,
  Drawing, //simple line draw
  Selecting, //select, open inspector window
  Deleting, //box delete
  ChangeMV, //box change mv
}
enum MvMode{
  Mountain = "M",
  Valley = "V",
  Border = "B",
  Aux = "A",
} 

const scale = (
  cpcoords: [number, number],
  scaleFactor: number,
  panOffset: [number, number],
) => {
  // Convert cp coordinates to pixel coordinates
  return [
    cpcoords[0] * scaleFactor + panOffset[0],
    cpcoords[1] * scaleFactor + panOffset[1],
  ];
};

const unscale = (
  pixelCoords: [number, number],
  scaleFactor: number,
  panOffset: [number, number],
): [number, number] => {
  // Convert pixel coordinates to cp coordinates
  return [
    (pixelCoords[0] - panOffset[0]) / scaleFactor,
    (pixelCoords[1] - panOffset[1]) / scaleFactor,
  ];
};

const edge_colors: {
  [key: string]: string;
} = {
  M: "red",
  V: "blue",
  B: "black",
  A: "green",
};


const renderCP = (
  cp: Fold,
  fabricCanvasRef: RefObject<Canvas | null>,
  scaleFactor: number,
  panOffset: [number, number],
) => {
  if (!fabricCanvasRef.current) {
    return;
  }
  const { vertices_coords, edges_vertices, edges_assignment } = cp;
  edges_vertices.forEach((edge, index) => {
    const [startIndex, endIndex] = edge;
    const start = scale(vertices_coords[startIndex], scaleFactor, panOffset);
    const end = scale(vertices_coords[endIndex], scaleFactor, panOffset);

    if (start && end && fabricCanvasRef.current) {
      const line = new Line([start[0], start[1], end[0], end[1]], {
        stroke: edge_colors[edges_assignment[index] as "M" | "V" | "B"] ?? "green",
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      fabricCanvasRef.current.add(line);
    }
  });
};

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);
  const [cp, setCP] = useState<Fold | null>(null);
  const cpRef = useRef<Fold | null>(null);
  useEffect(() => {
    cpRef.current = cp;
  }, [cp]);

  if (!context) {
    // should not be executed unless I goofed up the context provider
    return <p>Error: User context is not available.</p>;
  }

  const { userId, handleLogin, handleLogout } = context;

  const { cpID } = useParams<{ cpID: string }>();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);


  // Check authentication status
  useEffect(() => {
    if (userId !== undefined) {
      setIsLoading(false);
      if (!userId) {
        // TODO: make this UX nicer (redirect them to log in and then back here)
        navigate("/");
      }
    }
  }, [userId]);

  //fetch
  useEffect(() => {
    if (!isLoading && userId && cpID) {
      // Fetch the CP data
      get(`/api/designs/${cpID}`).then((cp: Fold) => {
        // Expand the CP by filling out redundant fields
        cp.vertices_edges = Array(cp.vertices_coords.length).fill(null).map(() => []);
        cp.vertices_vertices = Array(cp.vertices_coords.length).fill(null).map(() => []);

        cp.edges_vertices.forEach(([start, end], index) => {
          cp.vertices_edges[start].push(index);
          cp.vertices_edges[end].push(index);

          cp.vertices_vertices[start].push(end);
          cp.vertices_vertices[end].push(start);
        });
        setCP(cp);
      });
    }
  }, [isLoading, userId, cpID]);

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
            edges_foldAngle: cp.edges_foldAngle, //TODO: convert to degrees?
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
  }, [cp, cpID]);


  // Initialize FabricJS canvas
  useEffect(() => {
    if (!isLoading && userId && canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        allowTouchScrolling: true,
        // TODO: maybe add altActionKey or altSelectionKey, go through the options again to make
        // sure my settings are optimal
        backgroundColor: "gray", // TODO: match this with my actual color scheme
        selection:false,
      });
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
    }
  }, [isLoading, userId]);

  // Handle keyboard shortcuts for changing tool
  const [mode, setMode] = useState(Mode.Default);
  const modeRef = useRef<Mode>(Mode.Default);
  useEffect(() => {
    modeRef.current = mode;
  },[mode]);
  const [mvmode, setMvMode] = useState(MvMode.Mountain);
  const mvmodeRef = useRef<MvMode>(MvMode.Mountain);
  useEffect(() => {
    mvmodeRef.current = mvmode;
  },[mvmode])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch(event.key){
        case "a":
          setMvMode(MvMode.Mountain);
          break;
        case "s":
          setMvMode(MvMode.Valley);
          break;
        case "d":
          setMvMode(MvMode.Border);
          break;
        case "f":
          setMvMode(MvMode.Aux);
          break;

        case " ":
          event.preventDefault();//prevent scrolling
          setMode(Mode.Drawing);
          break;
        case "q":
          setMode(Mode.Selecting);
          break;
        case "w":
          setMode(Mode.Deleting);
          break;
        case "e":
          setMode(Mode.ChangeMV);
          break;
        default:
          setMode(Mode.Default);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  useEffect(() => {
    console.log("Current mode:", Mode[mode], "Current MV mode:", mvmode);
  }, [mode,mvmode]);

  // handle left click
  useEffect(() => {
    let clickStart: [number, number] | null = null;
    
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only handle left-click
      const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
      if (rect) {
      clickStart = [
        event.clientX - rect.left,
        event.clientY - rect.top,
      ];
      // console.log("left click down at:", clickStart);
      }
    };
    const handleMouseMove = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only handle left-click
      const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
      if (rect) {
        const clickEnd: [number, number] = [
          event.clientX - rect.left,
          event.clientY - rect.top,
        ];
        if (modeRef.current === Mode.Drawing && clickStart) {
          const tempLine = new Line(
            [clickStart[0], clickStart[1], clickEnd[0], clickEnd[1]],
            {
            stroke: edge_colors[mvmodeRef.current] ?? "gray",
            strokeWidth: 1,
            selectable: false,
            evented: false,
            }
          );

          if (fabricCanvasRef.current) {
              const existingTempLine = fabricCanvasRef.current?.getObjects().find(obj => obj.type === "line" && obj.strokeWidth === 1);
              if (existingTempLine) {
              fabricCanvasRef.current?.remove(existingTempLine); // Remove the existing temporary line
              }
              fabricCanvasRef.current?.add(tempLine); // Add the new temporary line
              fabricCanvasRef.current?.renderAll(); // Render the canvas
          }
        }
        
      }
    };
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only handle left-click
      const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
      if (rect) {
      const clickEnd: [number, number] = [
        event.clientX - rect.left,
        event.clientY - rect.top,
      ];
        // console.log("left click up at:", clickEnd);

        // Add logic for handling click and release based on the current mode
        if (modeRef.current === Mode.Drawing) {
          // console.log(clickStart,clickEnd,cpRef.current)
          if (clickStart && clickEnd && cpRef.current) {
            console.log(scaleFactorRef.current,panOffsetRef.current)
            console.log("Drawing mode active", unscale(clickStart, scaleFactorRef.current, panOffsetRef.current), unscale(clickEnd,scaleFactorRef.current,panOffsetRef.current));

            setCP(createEdge(cpRef.current,unscale(clickStart, scaleFactorRef.current, panOffsetRef.current),unscale(clickEnd,scaleFactorRef.current,panOffsetRef.current),Math.PI,mvmodeRef.current,SNAP_TOLERANCE/scaleFactorRef.current))
          } else {
            console.error("clickStart is null, cannot unscale");
          }
          // Add drawing logic here
        } else if (modeRef.current === Mode.Selecting) {
          console.log("Selecting mode active");
          // Add selecting logic here
        }
      }
      clickStart = null;
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);


  // Handle zooming with the mouse wheel
  const [scaleFactor, setScaleFactor] = useState(500);
  const scaleFactorRef = useRef<number>(scaleFactor);
  useEffect(() => {
    scaleFactorRef.current = scaleFactor;
  }, [scaleFactor]);

  useEffect(() => {
    const handleScroll = (event: WheelEvent) => {
      event.preventDefault();
      if (!fabricCanvasRef.current) return;

      const rect = fabricCanvasRef.current.getElement().getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const delta = event.deltaY > 0 ? 1-SCROLL_RATE : 1+SCROLL_RATE;
      const newScaleFactor = Math.min(Math.max(10, scaleFactorRef.current * delta), 10000);

      const [unscaledX, unscaledY] = unscale(
        [mouseX, mouseY],
        scaleFactorRef.current,
        panOffsetRef.current
      );

      const newPanOffset: [number, number] = [
        mouseX - unscaledX * newScaleFactor,
        mouseY - unscaledY * newScaleFactor,
      ];

      setScaleFactor(newScaleFactor);
      setPanOffset(newPanOffset);
    };

    window.addEventListener("wheel", handleScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleScroll);
    };
  }, []);

  // handle panning with right click
  const [panOffset, setPanOffset] = useState<[number, number]>([
    (window.innerWidth - scaleFactor) / 2,(window.innerHeight - scaleFactor) / 2  ]);
  const panOffsetRef = useRef<[number, number]>([0, 0]);
  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);
  useEffect(() => {
    let clickStart: { x: number; y: number } | null = null;
    let panning = false;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 2) { // Right-click
        const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
        if (rect) {
          clickStart = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
          panning = true;
          // console.log("right click down at:", clickStart);
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (panning) { // Right-click
        const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
        if (rect) {
          const clickEnd = { 
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
          // console.log("right click move at:", clickEnd);
          if (clickStart) {
            const deltaX = clickEnd.x - clickStart.x;
            const deltaY = clickEnd.y - clickStart.y;
            clickStart = clickEnd; // Update clickStart to the new position
            // Update the pan offset
            setPanOffset((prev) => [
              prev[0] + deltaX,
              prev[1] + deltaY,
            ]);
            // console.log("Panned by:", { deltaX, deltaY });
          }
        }
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      panning = false;
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  //prevent context window from popping up when right clicking
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault(); // Prevent the default right-click menu
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // Render cp on the canvas
  useEffect(() => {
    if (fabricCanvasRef.current && cpRef.current) {

      fabricCanvasRef.current.clear();
      if (fabricCanvasRef.current) {
        console.log("rerendering")
        renderCP(cpRef.current, fabricCanvasRef, scaleFactor, panOffset);
      }
      // fabricCanvasRef.current.add(rect);
      fabricCanvasRef.current.renderAll();
    }
  }, [cp, scaleFactor,panOffset]);

  const handleLogoutAndNavigate = () => {
    googleLogout();
    handleLogout();
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }
    navigate("/");
  };

  // Navbar items
  const items: MenuProps["items"] = [
    {
      key: "library",
      icon: (
        <img
          src={LibraryIcon}
          alt="Library"
          style={{ width: "0px" }}
          onClick={() => navigate("/")}
        />
      ),
    },
    {
      key: "logout",
      icon: <Button onClick={handleLogoutAndNavigate}>Logout</Button>,
    },
  ];

  // TODO: implement this loading spinner logic on the other pages as well
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }
  // console.log("CP data:", cp);
  return (
    <div className="flex flex-col h-screen">
      <Menu mode="horizontal" items={items} />
      <div className="flex-1 flex">
        <div className="w-full h-full">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
        {/* <div className="w-1/3 h-full">
          <p>{cp?._id}</p>
          <div>
            <h2>CP Details</h2>
            <p>{cp?.vertices_coords}</p>
            <pre>{JSON.stringify(cp, null, 2)}</pre>
          </div>
        </div> */}
      </div>
    </div>
  );
};

// TODO: fix the problem where we get redirected to library (I think bc of the order that it's detecting
// whether we're logged in and redirecting oof) upon refresh
export default Editor;
