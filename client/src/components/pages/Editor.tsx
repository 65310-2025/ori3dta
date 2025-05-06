import React, { useContext, useEffect, useState } from "react";

import { Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import { UserContext } from "../App";
import { CPCanvas } from "../modules/CPCanvas";
import { Viewer3D } from "../modules/Viewer3D";
import Navbar from "../modules/LandingNavbar";
import "./Editor.css";

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);

  if (!context) {
    // should not be executed unless I goofed up the context provider
    return <p>Error: User context is not available.</p>;
  }

  const { userId } = context;

  const { cpID } = useParams<{ cpID: string }>();

  // Check authentication status
  useEffect(() => {
    if (userId !== undefined) {
      setIsLoading(false);
      if (!userId) {
        navigate("/login");
      }
    }
  }, [userId]);

  // TODO: implement this loading spinner logic on the other pages as well
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // TODO: forward ref CP
  return (
    <>
      <Navbar />
      <div className="flex flex-col h-screen">
        <div className="flex-1 flex">
          <CPCanvas cpID={cpID} />
          <div className="Editor-sidebar">
            {/* <h2>CP Details. 3d model/xray to go here</h2> */}
            <div className="Viewer-container">
              <Viewer3D />
            </div>
            {/* <button
              className="Editor-button"
              onClick={() => {
                console.log("Button clicked!");
              }}
            >
              Click Me
            </button> */}
          </div>
        </div>
      </div>
    </>
  );
};

// TODO: fix the problem where we get redirected to library (I think bc of the order that it's detecting
// whether we're logged in and redirecting oof) upon refresh
export default Editor;
