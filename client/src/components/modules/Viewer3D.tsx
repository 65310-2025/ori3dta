import React, {
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Fold } from "../../types/fold";
import { getFaces,getFoldedFaces } from "../../utils/xray";


import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export interface Viewer3DProps {
  cp: Fold|null; // Replace 'any' with the appropriate type for 'cp'
  setCP: (cp: Fold) => void;
  cpRef: RefObject<Fold | null>;
}

const polygon3D = (vertices:[number,number,number][]) => {
  // Create a geometry from a set of vertices. Assume the vertices are in 3d space and are in circular order for easy triangulation. 
  const geometry = new THREE.BufferGeometry();
  const verticesArray = new Float32Array(vertices.flat());
  geometry.setAttribute("position", new THREE.BufferAttribute(verticesArray, 3));
  const indices = [];
  for (let i = 1; i < vertices.length - 1; i++) {
    indices.push(0, i, i + 1);
  }
  geometry.setIndex(indices);
  const front = new THREE.Mesh(geometry, faceMaterial);
  const back = new THREE.Mesh(geometry, faceMaterialBack);
  const polygon = new THREE.Group();
  polygon.add(front);
  polygon.add(back);
  // Create an outline for the polygon
  const edges = new THREE.EdgesGeometry(geometry);
  const outline = new THREE.LineSegments(edges, lineMaterial);
  polygon.add(outline);
  return polygon;
}

const faceMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.2,
  side: THREE.FrontSide//THREE.DoubleSide,
});
const faceMaterialBack = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.2,
  side: THREE.BackSide, 
});
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0x000000,
  linewidth: 2,
});

export const Viewer3D: React.FC<Viewer3DProps> = ({ cp, setCP, cpRef }) => {
  const mountRef: RefObject<HTMLDivElement | null> = useRef(null);
  const sceneRef = useRef<THREE.Scene | null>(null); // Ref for the scene
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null); // Ref for the camera
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null); // Ref for the renderer

  // Set up the 3D scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Set background color to white
    sceneRef.current = scene; // Store the scene in the ref

    // Camera
    const camera = new THREE.PerspectiveCamera(
      100,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(1, 1, 1);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera; // Store the camera in the ref

    // Renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer; // Store the renderer in the ref

    const controls = new OrbitControls(camera, renderer.domElement);

    // Starter square
    const geometry = new THREE.PlaneGeometry(1, 1); // Unit square
    const plane = new THREE.Mesh(geometry, faceMaterial);
    plane.rotation.x = -Math.PI / 2; // Rotate the plane to lie on the X-Y plane
    scene.add(plane);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update controls
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Register keybinds
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault();
      }

      if (event.key === "b") {
        if (cpRef.current=== null) return;
        const clippedCP = {
          ...cpRef.current,
          foldAngles: Object.fromEntries(
            Object.entries(cpRef.current.foldAngles || {}).map(([key, value]) => [
              key,
              Math.max(-180, Math.min(180, value as number)),
            ])
          ),
        };
        setCP(clippedCP);
        const foldedFaces = getFoldedFaces(cpRef.current);

        // Access and modify the scene
        if (sceneRef.current) {
          console.log("Clearing the scene");
          while (sceneRef.current.children.length > 0) {
            sceneRef.current.remove(sceneRef.current.children[0]);
          }
          for(const face of foldedFaces) {
            const polygon = polygon3D(face);
            sceneRef.current.add(polygon);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};
