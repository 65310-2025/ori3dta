import React from "react";

import logo from "../../../favicon.svg";
import Navbar from "../modules/LandingNavbar";
import "./Landing.css";
import demo from "../../assets/img/demo.jpg";

const Landing: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div className="Home">
        <div className="Home-title">
          <div className="Home-title-text">
            <h1>Ori3Dita: the modern crease pattern editor.</h1>
            <p>Browser-based, collaborative, and open source crease pattern editor and simulator with handling for non-flat creases. </p>
          </div>

          <div className="Home-title-demo">
            <img src={demo} alt="Demo" className="Home-demo-image" />
          </div>
        </div>
        <br />
        <br />
        <div className="Home-try-button">
          <button 
            className="TryNowButton" 
            onClick={() => window.location.href = "/login"}
          >
            Try it now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
