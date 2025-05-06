import React, { useContext, useEffect, useRef, useState } from "react";

import { Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import { ClientCPDto } from "../../../../dto/dto";
import { Fold } from "../../types/fold";
import { get, post } from "../../utils/requests";
import { UserContext } from "../App";
import { CPCanvas } from "../modules/CPCanvas";
import Navbar from "../modules/LandingNavbar";
import { Viewer3D } from "../modules/Viewer3D";
import "./Editor.css";

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);

  const [cp, setCP] = useState<Fold | null>(null);
  const cpRef = useRef<Fold | null>(null);

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

  useEffect(() => {
    cpRef.current = cp;
  }, [cp]);

  // Fetch the CP data from the server using CPid
  useEffect(() => {
    get(`/api/designs/${cpID}`).then((cp: Fold) => {
      // Expand the CP by filling out redundant fields
      cp.vertices_edges = Array(cp.vertices_coords.length)
        .fill(null)
        .map(() => []);
      cp.vertices_vertices = Array(cp.vertices_coords.length)
        .fill(null)
        .map(() => []);

      cp.edges_vertices.forEach(([start, end], index) => {
        cp.vertices_edges[start].push(index);
        cp.vertices_edges[end].push(index);

        cp.vertices_vertices[start].push(end);
        cp.vertices_vertices[end].push(start);
      });
      console.log(cp);
      setCP(cp);
    });
  }, [cpID]);

  useEffect(() => {
    if (cp) {
      const postCP = async () => {
        try {
          // convert cp to interface ClientCPDto
          const cpData: ClientCPDto = {
            vertices_coords: cp.vertices_coords,
            edges_vertices: cp.edges_vertices,
            edges_assignment: cp.edges_assignment,
            edges_foldAngle: cp.edges_foldAngle, // TODO: convert to degrees?
          };
          const response = await post(`/api/designs/${cpID}`, cpData);

          if (!response) {
            console.error("Failed to post CP data");
          } else {
            console.log("CP data successfully posted");
          }
        } catch (error) {
          console.error("Error posting CP data:", error);
        }
      };

      postCP();
    }
  }, [cp]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="Editor">
        <CPCanvas cp={cp} setCP={setCP} cpRef={cpRef} />
        <div className="Editor-sidebar">
          {/* <h2>CP Details. 3d model/xray to go here</h2> */}
          <div className="Viewer-container">
            <Viewer3D />
          </div>
        </div>
      </div>
    </>
  );
};

// TODO: fix the problem where we get redirected to library (I think bc of the order that it's detecting
// whether we're logged in and redirecting oof) upon refresh
export default Editor;
