"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type Model = {
  key: string; // S3 key
  id: string;
  createdAt: string;
  userId: string;
  offering_models: any[];
};

export default function OffModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>(
    {}
  );
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const router = useRouter();

  // 1️⃣ Fetch modelů z backendu
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch("/api/getOffModels");
        const data = await res.json();
        setModels(data.models || []);

        const initialLoading: Record<string, boolean> = {};
        (data.models || []).forEach((m: Model) => {
          initialLoading[m.key] = true;
        });
        setLoadingModels(initialLoading);

        console.log("Fetched models:", data.models);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, []);

  // 2️⃣ Three.js render přes presigned URL
  useEffect(() => {
    if (!models.length) return;

    const loader = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("black");

      const width = container.clientWidth;
      const height = container.clientHeight;
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);

      // Přidáme renderer jen pokud ještě není v DOM
      if (!container.contains(renderer.domElement)) {
        container.appendChild(renderer.domElement);
      }
      renderers.push(renderer);

      // světla
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);

      // 🔹 Fetch presigned URL a load GLTF
      fetch(`/api/getSignedUrl?key=${encodeURIComponent(model.key)}`)
        .then((res) => res.json())
        .then(({ url }) => {
          loader.load(
            url,
            (gltf) => {
              const obj = gltf.scene;
              scene.add(obj);

              const box = new THREE.Box3().setFromObject(obj);
              const center = box.getCenter(new THREE.Vector3());
              obj.position.sub(center);

              obj.rotation.y = Math.PI * 1.5;
              obj.scale.set(1, 1, 1);

              renderer.render(scene, camera);

              setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
            },
            undefined,
            (err) => {
              console.error("GLTF load error:", err);
              setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
            }
          );
        })
        .catch((err) => {
          console.error(err);
          setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
        });
    });

    // Cleanup rendererů
    return () => {
      renderers.forEach((renderer) => {
        renderer.dispose();
      });
    };
  }, [models]);

  if (loading)
    return <div style={{ color: "green" }}>Loading models list…</div>;
  if (!models.length)
    return <div style={{ color: "green" }}>No models for this user</div>;

  return (
    <>
      <h1
        style={{ position: "fixed", left: "48%", top: "150px", color: "green" }}
      >
        Trading
      </h1>
      <div
        style={{
          position: "fixed",
          top: "220px",
          left: "50%",
          padding: "20px",
          borderRadius: "15px",
          backgroundColor: "black",
          transform: "translateX(-50%)",
          height: "50vh",
          overflowY: "scroll",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)", // maximálně 3 sloupce
          gap: "20px",
        }}
      >
        {models.map((model) => (
          <div
            key={model.key}
            ref={(el) => {
              if (el) containerRefs.current.set(model.key, el);
            }}
            onClick={() =>
              router.push(
                `/dashboard/offModelViewPage?key=${encodeURIComponent(
                  model.key
                )}`
              )
            }
            style={{
              width: "300px", // fixní šířka
              height: "300px",
              borderRadius: "15px",
              overflow: "hidden",
              backgroundColor: "#222",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {loadingModels[model.key] && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "green",
                  backgroundColor: "rgba(0,0,0,0.5)",
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
