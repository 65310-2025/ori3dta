import React from "react";

import Navbar from "../modules/LandingNavbar";

const NotFound = () => {
  console.log("404 Not Found");
  return (
    <div>
      <Navbar />
      <div>
        <h1>404 Not Found</h1>
        <p>The page you requested couldn't be found.</p>
      </div>
    </div>
  );
};

export default NotFound;
