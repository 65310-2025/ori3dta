/* eslint-disable react/no-unknown-property */
import React, { useMemo, useState } from "react";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { CIRCLE_OPACITY, CIRCLE_RADIUS } from "../../constants/editor";
import { CP, Point } from "../../types/cp";
import { FoldedFace } from "../../types/xray";
import { pointsEqual } from "../../utils/cp";
import { findFaces, foldFaces } from "../../utils/xray";
import Polygon3D from "./Polygon";
import "./Viewer3D.css";

export interface Viewer3DProps {
  cp: CP | null;
  invalidVertices?: Point[];
  checkFoldability?: boolean;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  cp,
  invalidVertices = [],
  checkFoldability = false,
}) => {
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);

  const { foldedFaces, faces2D } = useMemo(() => {
    if (cp === null) return { foldedFaces: [], faces2D: [] };
    const f2d = findFaces(cp);
    return {
      foldedFaces: foldFaces(f2d, cp),
      faces2D: f2d,
    };
  }, [cp]);

  const invalid3DVertices = useMemo(() => {
    if (!checkFoldability || invalidVertices.length === 0) return [];

    const mappedVertices: [number, number, number][] = [];

    invalidVertices.forEach((iv) => {
      // Find this point in 2D faces to get its 3D counterpart
      for (let i = 0; i < faces2D.length; i++) {
        const pointIndex = faces2D[i].border.findIndex((p) =>
          pointsEqual(p, iv),
        );
        if (pointIndex !== -1) {
          mappedVertices.push(foldedFaces[i].border[pointIndex]);
          break; // Found it, move to next invalid vertex
        }
      }
    });

    return mappedVertices;
  }, [checkFoldability, invalidVertices, faces2D, foldedFaces]);

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
        <button
          className="Viewer-reset"
          onClick={() => {
            setPitch(0);
            setRoll(0);
          }}
        >
          Reset
        </button>
      </div>
      <Canvas>
        <group rotation={[(pitch * Math.PI) / 180, 0, (roll * Math.PI) / 180]}>
          {foldedFaces.map((f: FoldedFace) => (
            <Polygon3D key={`Face-${f.id}`} vertices={f.border} />
          ))}
          {invalid3DVertices.map((v, i) => (
            <mesh key={`invalid-v-${i}`} position={v}>
              <sphereGeometry args={[CIRCLE_RADIUS, 16, 16]} />
              <meshBasicMaterial
                color="red"
                transparent
                opacity={CIRCLE_OPACITY}
              />
            </mesh>
          ))}
        </group>
        <OrbitControls />
      </Canvas>
    </div>
  );
};
