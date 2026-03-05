"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type Model = {
  key: string;
  id: string;
  createdAt: string;
  userId: string;
  offering_models: any[];
};

export default function MyObjects() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const router = useRouter();

  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/getMyModels");
        const data = await res.json();
        setModels(data.models || []);
        const initialLoading: Record<string, boolean> = {};
        (data.models || []).forEach((m: Model) => { initialLoading[m.key] = true; });
        setLoadingModels(initialLoading);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  useEffect(() => {
    if (!models.length) return;
    const loader = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#111");

      const width = container.clientWidth, height = container.clientHeight;
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      if (!container.contains(renderer.domElement)) container.appendChild(renderer.domElement);
      renderers.push(renderer);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const light = new THREE.DirectionalLight(0xffffff, 10);
      light.position.set(5, 5, 5);
      scene.add(light);

      fetch(`/api/getSignedUrl?key=${encodeURIComponent(model.key)}`)
        .then((res) => res.json())
        .then(({ url }) => {
          loader.load(url, (gltf) => {
           const obj = gltf.scene;
scene.add(obj);
const box = new THREE.Box3().setFromObject(obj);
const center = box.getCenter(new THREE.Vector3());
const size = box.getSize(new THREE.Vector3());

// Vystředění objektu
obj.position.sub(center);
obj.rotation.y = Math.PI * 1.5;

// Kamera se přizpůsobí velikosti objektu
const maxDim = Math.max(size.x, size.y, size.z);
const fov = camera.fov * (Math.PI / 180);
const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;
camera.position.z = cameraZ;
camera.near = cameraZ / 100;
camera.far = cameraZ * 100;
camera.updateProjectionMatrix();

renderer.render(scene, camera);
            setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
          }, undefined, (err) => {
            console.error("GLTF load error:", err);
            setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
          });
        })
        .catch((err) => {
          console.error(err);
          setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
        });
    });

    return () => { renderers.forEach((r) => r.dispose()); };
  }, [models]);

  if (loading) return <div style={{ color: "#fff", fontFamily: "monospace" }}>Loading models list…</div>;
  if (!models.length) return <div style={{ color: "#fff", fontFamily: "monospace" }}>No models for this user</div>;

  return (
    <>
      <h1
        style={{
          position: "fixed",
          top: "150px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#fff",
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: "1.5rem",
        }}
      >
        My 3D Objects
      </h1>
      <div
        style={{
          position: "fixed",
          top: "220px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "20px",
          borderRadius: "15px",
          height: "50vh",
          overflowY: "scroll",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {models.map((model) => (
          <div
            key={model.key}
            ref={(el) => { if (el) containerRefs.current.set(model.key, el); }}
            onClick={() => router.push(`/lobby/objectViewPage?key=${encodeURIComponent(model.key)}`)}
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "15px",
              overflow: "hidden",
              backgroundColor: "#222",
              cursor: "pointer",
              position: "relative",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {loadingModels[model.key] && (
              <div
                style={{
                  position: "absolute",
                  top: 0, left: 0,
                  width: "100%", height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#fff",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  fontFamily: "monospace",
                  zIndex: 1,
                }}
              >
                Loading…
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
