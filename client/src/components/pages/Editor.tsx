/*
1. Plotting an fold object
- upload an object (user import). button -> file nav
- run parseFold to convert .fold to ts object
- plot the object on the canvas

2. draw and delete creases
- use fabric.js to register when and where clicks happen
  - show action in progress (preview line)
- run cpEdit with click locations as inputs
- clear canvas
- plot new object

3. build inspector for editing creases (esp. fold angle)

4. import three.js view window for rendering x ray

*/
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
import { useNavigate, useParams } from "react-router-dom";

import { ServerCPDto } from "../../../../dto/dto";
import LibraryIcon from "../../assets/icons/library.svg";
import { get, post } from "../../utils/requests";
import { UserContext } from "../App";

enum Mode {
  Default,
  Drawing, //simple line draw
  Selecting, //select, open inspector window
  Deleting, //box delete
  ChangeMV, //box change mv
}
enum MvMode{
  Mountain,
  Valley,
  Border,
  Aux
}

const scale = (
  cpcoords: [number, number],
  scaleFactor: number,
  panOffset: [number, number],
) => {
  //Convert cp coordinates to pixel coordinates
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    throw new Error("Canvas element not found");
  }
  const rect = canvas.getBoundingClientRect();
  const { width, height } = rect;

  return [
    cpcoords[0] * width * scaleFactor + panOffset[0],
    cpcoords[1] * height * scaleFactor + panOffset[1],
  ];
};

//for handling scroll wheel
const useScaleFactor = () => {
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const handleScroll = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      setScaleFactor((prev) => Math.max(0.1, prev + delta));
    };

    window.addEventListener("wheel", handleScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleScroll);
    };
  }, []);

  return scaleFactor;
};

const renderCP = (
  cp: ServerCPDto,
  fabricCanvasRef: RefObject<Canvas | null>,
  scaleFactor: number,
  panOffset: [number, number],
) => {
  if (!fabricCanvasRef.current) {
    return;
  }
  if (fabricCanvasRef.current) {
    const { vertices_coords, edges_vertices, edges_assignment } = cp;

    edges_vertices.forEach((edge, index) => {
      const [startIndex, endIndex] = edge;
      const start = scale(vertices_coords[startIndex], scaleFactor, panOffset);
      const end = scale(vertices_coords[endIndex], scaleFactor, panOffset);

      if (start && end) {
        const line = new Line([start[0], start[1], end[0], end[1]], {
          stroke:
            edges_assignment[index] === "M"
              ? "red"
              : edges_assignment[index] === "V"
                ? "blue"
                : edges_assignment[index] === "B"
                  ? "black"
                  : "green",
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.add(line);
        }
      }
    });
  }
};

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);
  const [cp, setCP] = useState<ServerCPDto | null>(null);

  if (!context) {
    // should not be executed unless I goofed up the context provider
    return <p>Error: User context is not available.</p>;
  }

  // TODO: the context destructuring happened here before
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
      get(`/api/designs/${cpID}`).then((cp: ServerCPDto) => {
        setCP(cp);
      });
    }
  }, [isLoading, userId, cpID]); //before: dependency [cp]

  //post
  useEffect(() => {
    if (cp) {
      const postCP = async () => {
        try {
          const response = await post(`/api/designs/${cpID}`, cp);

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
  const [mvmode, setMvMode] = useState(MvMode.Mountain);
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
    console.log("Current mode:", Mode[mode], "Current MV mode:", MvMode[mvmode]);
  }, [mode,mvmode]);

  //handle left click
  useEffect(() => {
    let clickStart: { x: number; y: number } | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only handle left-click
      const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
      if (rect) {
        clickStart = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        console.log("left click down at:", clickStart);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button !== 0) return; // Only handle left-click
      const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
      if (rect) {
        const clickEnd = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        console.log("left click up at:", clickEnd);

        // Add logic for handling click and release based on the current mode
        if (mode === Mode.Drawing) {
          console.log("Drawing mode active");
          // Add drawing logic here
        } else if (mode === Mode.Selecting) {
          console.log("Selecting mode active");
          // Add selecting logic here
        }
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const [panOffset, setPanOffset] = useState<[number, number]>([0, 0]);
  //handle right click
  useEffect(() => {
    let clickStart: { x: number; y: number } | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 2) { // Right-click
        const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
        if (rect) {
          clickStart = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
          console.log("right click down at:", clickStart);
        }
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 2) { // Right-click
        const rect = fabricCanvasRef.current?.getElement().getBoundingClientRect();
        if (rect) {
          const clickEnd = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          };
          console.log("right click up at:", clickEnd);
            if (clickStart) {
              const deltaX = clickEnd.x - clickStart.x;
              const deltaY = clickEnd.y - clickStart.y;
              setPanOffset((prev) => [
                prev[0] + deltaX,
                prev[1] + deltaY,
              ]);
              console.log("Panned by:", { deltaX, deltaY });
            }
        }
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
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

  // Handle zooming with the mouse wheel
  const scaleFactor = useScaleFactor();
  // const panOffset = usePanOffset();

  // Render cp on the canvas
  useEffect(() => {
    if (fabricCanvasRef.current && cp) {
      fabricCanvasRef.current.clear();
      cp.edges_assignment[4]="V";
      if (fabricCanvasRef.current) {
        renderCP(cp, fabricCanvasRef, scaleFactor, panOffset);
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
        <div className="w-2/3 h-full">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
        <div className="w-1//3 h-full">
          <p>{cp?._id}</p>
          <div>
            <h2>CP Details</h2>
            {/* <p>{cp?.vertices_coords}</p> */}
            <pre>{JSON.stringify(cp, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// TODO: fix the problem where we get redirected to library (I think bc of the order that it's detecting
// whether we're logged in and redirecting oof) upon refresh
export default Editor;
