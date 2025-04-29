import React, { useContext, useEffect, useState } from "react";

import { googleLogout } from "@react-oauth/google";
import { Button, Menu, Spin } from "antd";
import type { MenuProps } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import LibraryIcon from "../../assets/icons/library.svg";
import { UserContext } from "../App";
import CPCanvas from "../modules/CPCanvas";

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);

  if (!context) {
    // should not be executed unless I goofed up the context provider
    return <p>Error: User context is not available.</p>;
  }

  const { userId, handleLogout } = context;

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

  const handleLogoutAndNavigate = () => {
    googleLogout();
    handleLogout();
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
          onClick={() => navigate("../library")}
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

  // TODO: forward ref CP
  return (
    <div className="flex flex-col h-screen">
      <Menu mode="horizontal" items={items} />
      <div className="flex-1 flex">
        <CPCanvas cpID={cpID} />
        {
          // <div className="w-2/3 h-full">
          //   <canvas ref={canvasRef} className="w-full h-full"></canvas>
          // </div>
        }
        <div className="w-1/3 h-full">
          <div>
            <h2>CP Details. 3d model/xray to go here</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

// TODO: fix the problem where we get redirected to library (I think bc of the order that it's detecting
// whether we're logged in and redirecting oof) upon refresh
export default Editor;
