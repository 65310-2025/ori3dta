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
            <p>
              Ori3Dita is a web-based crease pattern software for origami design. The core feature, aside from being web-based, is the ability to draw creases with specified non-flat fold angles. This allows designers to create and accurately document models with intentional 3d structures. Additionally, Ori3Dita introduces a novel algorithm for computing layer ordering and detecting self intersection in non-flat crease patterns.
              
              <br /><br />
              Ori3Dita was built by Brandon Wong, David Lee, Kenny Zhang, and Abby Chou as their final project for Professor Erik Demaine's 6.5310 "Geometric folding algorithms" class at MIT. The project is currently in its "minimum working prototype" phase, but is intended to be further developed into a fully functional crease pattern editor for public use.

              <br /><br />
              To report a bug, request a feature, or make a pull request, all source code is available at the following Github repository: <a href="https://github.com/65310-2025/ori3dta">https://github.com/65310-2025/ori3dta</a>.              
            </p>
            {/* <p>
              Ori3Dita's web hosting is funded by OrigaMIT. If you would like to financially support the project, you can do so here: ___. If you would like to join the community of Ori3Dita users and developers, you can join the discord here: ___
            </p> */}
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
              Ori3Dita uses keybinds to optimize the drawing speed for the user. The default keybinds are listed below--most keybinds are easily accessible with the left hand of a QWERTY keyboard, so that the user can keep their right hand on the mouse. Custom keybinds will be a feature in the future.
              <br />
              <br />
              <h3>Edge assignment modes</h3>
              <table>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Edge assignment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A</td>
                    <td>Mountain</td>
                  </tr>
                  <tr>
                    <td>S</td>
                    <td>Valley</td>
                  </tr>
                  <tr>
                    <td>D</td>
                    <td>Border</td>
                  </tr>
                  <tr>
                    <td>F</td>
                    <td>Auxiliary</td>
                  </tr>
                </tbody>
              </table>
              <br />
              <br />
              <h3>Crease pattern canvas tools</h3>
              <table>
                <thead>
                  <tr>
                  <th>Key</th>
                  <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                  <td>Space</td>
                  <td>Draw</td>
                  </tr>
                  <tr>
                  <td>W</td>
                  <td>Delete</td>
                  </tr>
                  <tr>
                  <td>Q</td>
                  <td>Select</td>
                  </tr>
                  <tr>
                  <td>E</td>
                  <td>Change MV</td>
                  </tr>
                  <tr>
                  <td>T</td>
                  <td>Edit vertex (fix Kawasaki)</td>
                  </tr>
                  <tr>
                  <td>G</td>
                  <td>Edit crease (change fold angle)</td>
                  </tr>
                  <tr>
                  <td>Scroll</td>
                  <td>Zoom in/out</td>
                  </tr>
                  <tr>
                  <td>Option + Drag</td>
                  <td>Pan</td>
                  </tr>
                </tbody>
                </table>

              <h3>3D viewer controls</h3>
                <table>
                <thead>
                  <tr>
                  <th>Key</th>
                  <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                  <td>B</td>
                  <td>Refresh X-ray</td>
                  </tr>
                  <tr>
                  <td>-</td>
                  <td>Render X-ray with previous starting face</td>
                  </tr>
                  <tr>
                  <td>=</td>
                  <td>Render X-ray with next starting face</td>
                  </tr>
                  <tr>
                  <td>Left Click</td>
                  <td>Rotate model</td>
                  </tr>
                  <tr>
                  <td>Scroll</td>
                  <td>Zoom in/out</td>
                  </tr>
                  <tr>
                  <td>Right Click</td>
                  <td>Pan</td>
                  </tr>
                </tbody>
                </table>
              {/* option drag: pan <br /> */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
