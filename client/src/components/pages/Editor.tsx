import React, { useContext, useRef, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { UserContext } from "../App";
import { Canvas, Rect } from "fabric";

const Editor: React.FC = () => {
  const context = useContext(UserContext);

  if (!context) {
    return null; // or handle the case where context is null
  }

  const { userId, handleLogin, handleLogout } = context;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = new Canvas(canvasRef.current);

      // test rectangle
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: "red",
        width: 50,
        height: 50,
      });
      canvas.add(rect);

      return () => {
        canvas.dispose();
      };
    }
    console.log(userId);
  }, []);

  return (
    <>
      {userId ? (
        <button
          onClick={() => {
            googleLogout();
            handleLogout();
          }}
        >
          Logout
        </button>
      ) : (
        <GoogleLogin onSuccess={handleLogin} onError={() => console.log("Login failed")} />
      )}
      <h1>hello there</h1>
      <canvas ref={canvasRef}></canvas>
    </>
  );
};

export default Editor;
