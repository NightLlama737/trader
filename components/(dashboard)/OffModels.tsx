"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type OffModel = {
  id: string;
  name: string;
  description: string;
  price: number;
  url: string; // presigned URL
  userId: string;
  createdAt: string;
};

export default function OffModels() {
  const [models, setModels] = useState<OffModel[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const router = useRouter();

  // 1️⃣ Fetch presigned URL modelů z backendu
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/getOffModels");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Fetch failed: ${res.status} ${text}`);
        }
        const data = await res.json();
        setModels(data.models || []);
        console.log("Fetched offModels:", data.models);
      } catch (err) {
        console.error("Failed to fetch offModels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  // 2️⃣ Three.js render
  useEffect(() => {
    if (!models.length) return;

    models.forEach((model) => {
      const container = containerRefs.current.get(model.id);
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

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      const loader = new GLTFLoader();
      loader.load(
        model.url, // presigned URL
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
  if (!models.length) return <div>No models available</div>;

  return (
    <>
      <h1 style={{ marginTop: "150px", color: "white" }}>Offered Models</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {models.map((model, idx) => (
          <div
            key={`${model.id}-${idx}`}
            ref={(el) => {
              if (el) containerRefs.current.set(model.id, el);
            }}
            onClick={() =>
              router.push(
                `/lobby/offModelViewPage?modelId=${encodeURIComponent(
                  model.id
                )}`
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
