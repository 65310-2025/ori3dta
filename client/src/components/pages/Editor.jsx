import React, { useContext, useRef, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { UserContext } from "../App";
import { Canvas, Rect } from "fabric";

const Editor = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);
  const canvasRef = useRef(null);

  useEffect(() => {
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
    }
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
        <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
      )}
      <h1>hello there</h1>
      <canvas ref={canvasRef}></canvas>
    </>
  );
};

export default Editor;
