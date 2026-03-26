import React, { useMemo, useState } from "react";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { CP } from "../../types/cp";
import { FoldedFace } from "../../types/xray";
import { findFaces, foldFaces } from "../../utils/xray";
import Polygon3D from "./Polygon";
import "./Viewer3D.css";

export interface Viewer3DProps {
  cp: CP | null;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({ cp }) => {
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);

  const foldedFaces = useMemo(() => {
    if (cp === null) return [];
    return foldFaces(findFaces(cp), cp);
  }, [cp]);

  return (
    <div className="Viewer">
      <div className="Viewer-controls">
        <label>
          Pitch
          <input
            type="range"
            min="-180"
            max="180"
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
          />
        </label>
        <label>
          Roll
          <input
            type="range"
            min="-180"
            max="180"
            value={roll}
            onChange={(e) => setRoll(Number(e.target.value))}
          />
        </label>
        <button className="Viewer-reset" onClick={() => { setPitch(0); setRoll(0); }}>Reset</button>
      </div>
      <Canvas>
        <group rotation={[(pitch * Math.PI) / 180, 0, (roll * Math.PI) / 180]}>
          {foldedFaces.map((f: FoldedFace) => (
            <Polygon3D key={`Face-${f.id}`} vertices={f.border} />
          ))}
        </group>
        <OrbitControls />
      </Canvas>
    </div>
  );
};
