import React, {
    RefObject,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// import "./Viewer3D.css"

export const Viewer3D: React.FC = () => {
    const mountRef: RefObject<HTMLDivElement | null> = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff); // Set background color to white
        // Camera
        const camera = new THREE.PerspectiveCamera(
            100,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        // camera.position.z = 5;
        camera.position.set(1, 1, 1);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(
            mountRef.current.clientWidth,
            mountRef.current.clientHeight
        );
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        // controls.enableDamping = true; // Enable damping for smoother controls


        // starter square
        const geometry = new THREE.PlaneGeometry(1, 1); // Unit square
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x000000, 
            transparent: true, 
            opacity: 0.1, 
            side: THREE.DoubleSide // Make the material viewable from both sides
        });
        const plane = new THREE.Mesh(geometry, material);
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

    useEffect(() => {
        if (!mountRef.current) return;

        const button = document.createElement("button");
        button.textContent = "Click Me";
        button.style.position = "absolute";
        button.style.top = "10px";
        button.style.left = "10px";
        button.style.zIndex = "1";
        button.addEventListener("click", () => {
            alert("Button clicked!");
        });

        mountRef.current.appendChild(button);

        return () => {
            button.removeEventListener("click", () => {});
            mountRef.current?.removeChild(button);
        };
    }, []);

    return <div ref={mountRef} style={{ width: "100%", height: "100%", display: "block" }} />;
};