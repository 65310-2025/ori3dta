import React from "react";

import { useNavigate } from "react-router-dom";

import Navbar from "../modules/LandingNavbar";
import "./Docs.css";

const Docs: React.FC = () => {
  const navigate = useNavigate();

  const makeNavigate = (path: string) => () => {
    navigate(path);
  };

  return (
    <div>
      <Navbar />
      <div className="Home">
        <div className="Docs">
          <div className="Docs-sidebar">
            <p>TODO: style table of contents/sidebar here</p>
            <h2>Table of contents</h2>
            <a href="#docs">Documentation</a>
            <a href="#overview">Overview</a>
            <a href="#getstarted">Getting started</a>
            <a href="#tools">Tools reference</a>
          </div>
          <div className="Docs-content">
            <h1 id="docs">Documentation</h1>
            <h2 id="overview">Overview</h2>
            <p>who what why how. core features</p>
            <h2 id="getstarted">Getting started</h2>
            <p>
              To get started, login with a Google acount{" "}
              <a onClick={makeNavigate("/login")}>here</a>
            </p>
            <p>
              Once logged in, you can see your designs in the{" "}
              <a onClick={makeNavigate("/library")}>Library</a> tab, and you can
              create new designs by clicking the &quot;New Design&quot; button.
              Optionally, the New Design button also supports importing existing
              crease patterns. These must be uploaded as a <code>.fold</code>{" "}
              file.
            </p>
            <p>
              From the Library tab, simply click on a design to open it in the
              editor. From there, you can edit the crease pattern and see a live
              3D rendered preview of the folded state.
            </p>
            <h2 id="tools">Tools reference</h2>
            <p>
              list of tools, what they do, how to use them, and keybinds
              <br />
              <br />
              ASDF: mountain valley border auxiliary
              <br />
              <br />
              space: draw <br />
              w: delete <br />
              select and change mv to be implemented and placed at e and r{" "}
              <br />
              t: edit vertex (fix kawasaki) <br />
              g: edit crease (change fold angle) <br />
              b: fold x ray <br />
              option drag: pan <br />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
