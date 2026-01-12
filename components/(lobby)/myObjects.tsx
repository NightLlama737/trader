"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type Model = {
  key: string; // S3 key
  url: string; // presigned URL nebo S3 URL
  id: string;
  createdAt: string;
  userId: string;
  offering_models: any[];
};

export default function MyObjects() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const router = useRouter();

  // 1️⃣ Fetch modelů z backendu
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/getMyModels");
        const data = await res.json();
        setModels(data.models || []);
        console.log("Fetched models:", data.models);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  // 2️⃣ Three.js render pro každý model
  useEffect(() => {
    if (!models.length) return;

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x222222);

      const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      // světla
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      const loader = new GLTFLoader();
      loader.load(
        model.url, // přímo S3 URL nebo presigned URL
        (gltf) => {
          const obj = gltf.scene;
          scene.add(obj);

          const box = new THREE.Box3().setFromObject(obj);
          const center = box.getCenter(new THREE.Vector3());
          obj.position.sub(center);

          obj.rotation.y = Math.PI * 1.5;
          obj.scale.set(1, 1, 1);

          renderer.render(scene, camera);
        },
        undefined,
        (error) => console.error("Error loading GLTF:", error)
      );
    });
  }, [models]);

  if (loading) return <div>Loading...</div>;
  if (!models.length) return <div>No models for this user</div>;

  return (
    <>
      <h1 style={{ marginTop: "150px", color: "white" }}>My 3D Objects</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {models.map((model, idx) => (
          <div
            key={`${model.key}-${idx}`}
            ref={(el) => {
              if (el) containerRefs.current.set(model.key, el);
            }}
            onClick={() =>
              router.push(
                `/lobby/objectViewPage?key=${encodeURIComponent(model.key)}`
              )
            }
            style={{
              width: "100%",
              height: "300px",
              borderRadius: "5px",
              border: "1px solid aqua",
              backgroundColor: "#222",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </>
  );
}
