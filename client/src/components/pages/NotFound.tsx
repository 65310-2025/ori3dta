import React from "react";

import Navbar from "../modules/LandingNavbar";
import "./NotFound.css";

const NotFound: React.FC = () => {
  console.log("404 Not Found");
  return (
    <div>
      <Navbar />
      <div className="Home">
        <div className="Notfound-container">
          <h1>404 Not Found</h1>
          <p>The page you requested couldn&apos;t be found.</p>
          <button className="Notfound-home-button">
            <a className="Notfound-home-link" href="/">
              Go back to the homepage
            </a>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
