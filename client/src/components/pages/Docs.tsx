import React from "react";

import Navbar from "../modules/LandingNavbar";
import "./Docs.css";

const Docs: React.FC = () => {
  return (
    <div>
      <Navbar />
      <div className="Home">
        <div className="Docs">
          <div className="Docs-sidebar">
            <p>TODO: table of contents/sidebar here</p>
          </div>
          <div className="Docs-content">
            <h1>Documentation</h1>
            <h2>Overview</h2>
            <p>who what why how. core features</p>
            <h2>Getting started</h2>
            <p>make a new design, basic tools</p>
            <h2>Tools reference</h2>
            <p>list of tools, what they do, how to use them, and keybinds
                <br /><br />
                ASDF: mountain valley border auxiliary
                <br /><br />
                space: draw <br />
                w: delete <br />
                select and change mv to be implemented and placed at e and r <br />
                t: edit vertex (fix kawasaki) <br />
                g: edit crease (change fold angle) <br />
                b: fold x ray <br />
                option drag: pan <br />


            </p>
            <h2>How it works</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
