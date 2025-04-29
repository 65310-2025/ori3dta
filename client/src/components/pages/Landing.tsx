import React from "react";

import logo from "../../../favicon.svg";
import demo from "../../assets/img/demo.jpg";
import Navbar from "../modules/LandingNavbar";
import "./Landing.css";

const Landing: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div className="Home">
        <div className="Home-title-block">
          <div className="Home-title-logo">
            <img src={logo} alt="Ori3Dita Logo" className="Home-logo" />
          </div>
          <div className="Home-title-text">
            <h1 className="Home-title-text">Ori3Dita</h1>
            <h2 className="Home-title-text">
              The modern crease pattern editor.
            </h2>
          </div>
        </div>
        <div className="Home-title-block">
          <div className="Home-demo-text">
            <h3 className="Home-demo-text">
              Browser-based, collaborative, and open source crease pattern
              editor and simulator with handling for non-flat creases.{" "}
            </h3>
            <div className="Home-try-button">
              <button
                className="TryNowButton"
                onClick={() => (window.location.href = "/login")}
              >
                Try it now
              </button>
            </div>
          </div>
          <img src={demo} alt="Demo" className="Home-demo-image" />
        </div>
      </div>
    </div>
  );
};

export default Landing;
