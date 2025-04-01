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
import React, { useContext, useEffect, useRef, useState } from "react";

import { googleLogout } from "@react-oauth/google";
import { Button, Menu, Spin } from "antd";
import type { MenuProps } from "antd";
import { Canvas, Rect } from "fabric";
import { useNavigate, useParams } from "react-router-dom";

import LibraryIcon from "../../assets/icons/library.svg";
import { UserContext } from "../App";
import { ServerCPDto } from "../../../../dto/dto";
import { get } from "../../utils/requests";

interface FileData {
  _id: string;
  title: string;
  description: string;
  content?: string; // maybe easiest will be to save it as fold file, which is a string that can be parsed as json
}

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

  useEffect(() => {
    if (!isLoading && userId && cpID) {
      // Fetch the CP data
      get(`/api/designs/${cpID}`).then((cp: ServerCPDto) => {
        setCP(cp);
      });
    }
  }, [isLoading, userId, cpID]); //before: dependency [cp]

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
        <div className="w-1//3 h-full">
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
