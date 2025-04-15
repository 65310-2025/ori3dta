import React, { useContext, useEffect, useRef, useState } from "react";

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
  Drawing, // simple line draw
  Selecting, // select, open inspector window
  Deleting, // box delete
  ChangeMV, // box change mv
}

enum MvMode {
  Mountain,
  Valley,
  Border,
  Aux,
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

const scale = (
  cpcoords: [number, number],
  scaleFactor: number,
  panOffset: [number, number],
): [number, number] => {
  // Convert cp coordinates to pixel coordinates
  return [
    cpcoords[0] * scaleFactor + panOffset[0],
    cpcoords[1] * scaleFactor + panOffset[1],
  ];
};

const useScaleFactor = () => {
  const [scaleFactor, setScaleFactor] = useState(300);

  useEffect(() => {
    const handleScroll = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.99 : 1.01;
      setScaleFactor((prev) => Math.min(Math.max(10, prev * delta), 10000));
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
  fabricCanvas: Canvas,
  scaleFactor: number,
  panOffset: [number, number],
) => {
  const { vertices_coords, edges_vertices, edges_assignment } = cp;
  const edge_colors: Record<"M" | "V" | "B", string> = {
    M: "red",
    V: "blue",
    B: "black",
  };

  edges_vertices.forEach((edge, index) => {
    const [startIndex, endIndex] = edge;
    const start = scale(vertices_coords[startIndex], scaleFactor, panOffset);
    const end = scale(vertices_coords[endIndex], scaleFactor, panOffset);

    const line = new Line([start[0], start[1], end[0], end[1]], {
      stroke:
        edge_colors[edges_assignment[index] as "M" | "V" | "B"] ?? "green",
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });
    fabricCanvas.add(line);
  });
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

  const { userId, handleLogout } = context;

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
  }, [isLoading, userId, cpID]);

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
      if (event.key == " ") {
        event.preventDefault();
      }
      if (event.key in mode_keys) {
        setMode(mode_map[event.key as ModeKey]);
      }
      if (event.key in mv_keys) {
        setMvMode(mv_map[event.key as MvKey]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let clickStart: { x: number; y: number } | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const rect = fabricCanvasRef.current
        ?.getElement()
        .getBoundingClientRect();
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
      const rect = fabricCanvasRef.current
        ?.getElement()
        .getBoundingClientRect();
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

  // Handle zooming with the mouse wheel
  const scaleFactor = useScaleFactor();

  const [panOffset, setPanOffset] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    let clickStart: { x: number; y: number } | null = null;
    let panning = false;

    const handleMouseDown = (event: MouseEvent) => {
      console.log(event);
      if (event.button === 2) {
        clickStart = {
          x: event.clientX,
          y: event.clientY,
        };
        panning = true;
        console.log("Starting panning");
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (panning) {
        const clickEnd = {
          x: event.clientX,
          y: event.clientY,
        };
        if (clickStart) {
          const deltaX = clickEnd.x - clickStart.x;
          const deltaY = clickEnd.y - clickStart.y;
          clickStart = clickEnd;
          setPanOffset((prev) => [prev[0] + deltaX, prev[1] + deltaY]);
        }
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      console.log("Stopped panning");
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
    if (fabricCanvasRef.current && cp) {
      const fabricCanvas = fabricCanvasRef.current;
      fabricCanvas.clear();
      renderCP(cp, fabricCanvas, scaleFactor, panOffset);
    }
  }, [cp, scaleFactor, panOffset]);

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
  return (
    <div className="flex flex-col h-screen">
      <Menu mode="horizontal" items={items} />
      <div className="flex-1 flex">
        <div className="w-2/3 h-full">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
        <div className="w-1/3 h-full">
          <p>{cp?._id}</p>
          <div>
            <h2>CP Details</h2>
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
