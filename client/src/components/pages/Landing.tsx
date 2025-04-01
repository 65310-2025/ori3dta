import React, { useContext } from "react";

import logo from "../../../favicon.svg";
import Navbar from "../modules/Navbar";
import "./Landing.css";
import Library from "./Library";
import Login from "./Login";

const Landing: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div className="Home">
        <div className="Home-title">
          <div className="Home-title-logo">
            <img src={logo} className="Home-logo" alt="logo" />
          </div>
          <div className="Home-title-text">
            <h1 className="Home-title-text">Ori3dita</h1>
            <h2 className="Home-title-text">
              The collaborative 3D crease pattern editor
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
