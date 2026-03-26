import React, { useContext, useEffect, useState } from "react";

import { Spin } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import { ServerCPDto } from "../../../../dto/dto";
import { CP } from "../../types/cp";
import { GridSettings, defaultGridSettings } from "../../types/ui";
import { convertServerCPDto, convertToClientCPDto } from "../../utils/cp";
import { checkVertexFoldable } from "../../utils/kawasaki";
import { get, post } from "../../utils/requests";
import { UserContext } from "../App";
import CPCanvas from "../modules/CPCanvas";
import Navbar from "../modules/LandingNavbar";
import { Viewer3D } from "../modules/Viewer3D";
import "./Editor.css";
import Error from "./Error";

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);

  const [cp, setCP] = useState<CP | null>(null);

  const [gridSettings, setGridSettings] = useState<GridSettings>(defaultGridSettings);

  const invalidVertices = React.useMemo(() => {
    if (!cp || !gridSettings.checkFoldability) return [];
    return cp.vertices.filter(v => !checkVertexFoldable(v, cp));
  }, [cp, gridSettings.checkFoldability]);

  if (!context) {
    return <Error />;
  }

  const { userId } = context;

  const { cpID } = useParams<{ cpID: string }>();

  useEffect(() => {
    if (userId !== undefined) {
      setIsLoading(false);
      if (!userId) {
        navigate("/login");
      }
    }
  }, [userId]);

  useEffect(() => {
    get(`/api/designs/${cpID}`).then((serverCP: ServerCPDto) => {
      const convertedCP = convertServerCPDto(serverCP);
      setCP(convertedCP);
    });
  }, [cpID]);

  useEffect(() => {
    if (!cp) {
      return;
    }
    console.log("Posting CP to server", cp);
    const handler = setTimeout(() => {
      const cpData = convertToClientCPDto(cp);
      post(`/api/designs/${cpID}`, cpData)
        .then((response) => {
          if (!response) {
            console.error(`Failed to post CP data: ${response}`);
          } else {
            console.log(`CP data successfully posted: ${response}`);
          }
        })
        .catch((error) => {
          console.error(`Error posting CP data: ${error}`);
        });
    }, 500);

    return () => clearTimeout(handler);
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
        <CPCanvas 
          cp={cp} 
          setCP={setCP} 
          gridSettings={gridSettings} 
          setGridSettings={setGridSettings} 
          invalidVertices={invalidVertices} 
        />
        <div className="Editor-sidebar">
          <div className="Viewer-container">
            <Viewer3D cp={cp} invalidVertices={invalidVertices} checkFoldability={gridSettings.checkFoldability} />
          </div>
          {/* <div className="viewer-buttons">
            <button>Hi</button>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default Editor;
