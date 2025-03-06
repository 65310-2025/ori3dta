import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { googleLogout } from "@react-oauth/google";
import { Button, Menu, Spin } from "antd";
import type { MenuProps } from "antd";
import { Canvas } from "fabric";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../App";
import { Mode, addListenersForMode, removeListenersForMode } from "../../draw";

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState(Mode.ADD_LINE);

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
  }, [userId, navigate]);

  // Resize canvas function
  const resizeCanvas = useCallback((canvasObj: Canvas) => {
    // Set the FabricJS canvas dimensions to match the parent container
    // (parent of the parent because FabricJS adds a wrapper div around the canvas)
    const parent = canvasRef.current?.parentElement?.parentElement;
    if (parent) {
      canvasObj.setDimensions({
        width: parent.clientWidth,
        height: parent.clientHeight,
      });
    }
  }, []);

  const initListeners = (canvasObj: Canvas) => {
    // starting mode is ADD_LINE
    addListenersForMode(canvasObj, Mode.ADD_LINE);
  }

  // TODO: logic to change mode

  // Initialize Fabric canvas
  useEffect(() => {
    if (!isLoading && userId && canvasRef.current) {
      const fabricCanvas = new Canvas(canvasRef.current, {
        allowTouchScrolling: true,
        // TODO: maybe add altActionKey or altSelectionKey, go through the options again to make
        // sure my settings are optimal
        backgroundColor: "gray", // TODO: match this with my actual color scheme
      });
      fabricCanvasRef.current = fabricCanvas;

      // Add event listeners to Canvas
      initListeners(fabricCanvas);

      // Initial resize
      resizeCanvas(fabricCanvas);

      // Resize canvas on window resize
      const handleResize = () => resizeCanvas(fabricCanvas);
      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        fabricCanvas.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isLoading, userId, resizeCanvas]);

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
      icon: <Button onClick={() => navigate("/")}>Library</Button>,
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
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>
    </div>
  );
};

// TODO: fix the problem where we get redirected to library (I think bc of the order that it's detecting
// whether we're logged in and redirecting oof) upon refresh
export default Editor;
