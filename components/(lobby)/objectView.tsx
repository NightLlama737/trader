"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRouter, useSearchParams } from "next/navigation";

type Model = {
  id: string;
  key: string;
  url: string;
};

export default function ObjectView() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key"); // string | null
  const mountRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<Model | null>(null);
  const router = useRouter();

  // 1️⃣ Fetch presigned URL / S3 URL podle key
  useEffect(() => {
    if (!key) return;

    fetch(`/api/models?key=${encodeURIComponent(key)}`)
      .then((res) => res.json())
      .then((data) => setModel(data.model))
      .catch(console.error);
  }, [key]);

  // 2️⃣ ESC → back to lobby
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/lobby"); // nebo router.back() pokud chceš předchozí stránku
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [router]);

  // 3️⃣ Three.js render
  useEffect(() => {
    if (!mountRef.current || !model) return;

    const width = 800;
    const height = 500;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 5, 5);
    scene.add(dir);

    const loader = new GLTFLoader();
    loader.load(
      model.url,
      (gltf) => {
        const obj = gltf.scene;
        scene.add(obj);

        // vycentrování
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);

        // fit camera
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        camera.position.set(0, maxDim * 0.5, cameraZ);
        camera.lookAt(0, 0, 0);

        controls.target.set(0, 0, 0);
        controls.update();
      },
      undefined,
      (error) => console.error("Error loading GLTF:", error)
    );

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [model]);

  if (!key) return <div style={{ color: "white" }}>Missing key</div>;
  if (!model) return <div style={{ color: "white" }}>Loading model…</div>;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        background: "#000",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "800px 300px",
          gap: "20px",
        }}
      >
        {/* 3D view */}
        <div
          ref={mountRef}
          style={{
            width: 800,
            height: 500,
            border: "1px solid #333",
            background: "#111",
          }}
        />
        {/* Sidebar s popiskem a tlačítky */}
        <div
          style={{
            width: 300,
            padding: 50,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            border: "1px solid #333",
            background: "#1e1e1e",
            color: "white",
          }}
        >
          <h4>{model.key}</h4>
          <button
            style={{
              display: "inline-block",
              backgroundColor: "aqua",
              color: "#000",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            <a
              href={model.url} // presigned URL
              download={model.key.split("/").pop()} // název souboru
              style={{
                display: "inline-block",
                backgroundColor: "aqua",
                color: "#000",
                borderRadius: "4px",
                textDecoration: "none",
                fontWeight: "bold",
                padding: "10px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              Download
            </a>
          </button>

          <button
            style={{
              display: "inline-block",
              backgroundColor: "aqua",
              color: "#000",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() =>
              router.push(
                `/lobby/addObjectTrade?s3Key=${encodeURIComponent(model.key)}`
              )
            }
          >
            Trade
          </button>
        </div>
      </div>
      <h3
        style={{
          position: "absolute",
          bottom: "20px",
          color: "white",
          fontSize: "14px",
        }}
      >
        Press ESC to exit...
      </h3>
    </div>
  );
}
