"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };

type Model = {
  key: string;
  id: string;
  createdAt: string;
  userId: string;
  name: string;
  description: string;
  price: number;
  category?: Category | null;
  url: string;
};

export default function OffModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const router = useRouter();

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  // Fetch models (with optional category filter)
  useEffect(() => {
    async function fetchModels() {
      setLoading(true);
      try {
        const url = selectedCategory
          ? `/api/getOffModels?categoryId=${selectedCategory}`
          : "/api/getOffModels";
        const res = await fetch(url);
        const data = await res.json();
        const fetched: Model[] = data.models || [];
        setModels(fetched);

        const initialLoading: Record<string, boolean> = {};
        fetched.forEach((m) => { initialLoading[m.key] = true; });
        setLoadingModels(initialLoading);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, [selectedCategory]);

  // Three.js renders
  useEffect(() => {
    if (!models.length) return;

    const loader = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      // Clear old canvas
      container.innerHTML = "";

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);

      const width = container.clientWidth || 260;
      const height = container.clientHeight || 260;
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);
      renderers.push(renderer);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);

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

              renderer.render(scene, camera);
              setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
            },
            undefined,
            () => setLoadingModels((prev) => ({ ...prev, [model.key]: false }))
          );
        })
        .catch(() => setLoadingModels((prev) => ({ ...prev, [model.key]: false })));
    });

    return () => {
      renderers.forEach((r) => r.dispose());
    };
  }, [models]);

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", paddingTop: "80px" }}>

      {/* ── Sidebar ── */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: "80px",
          width: "200px",
          height: "calc(100vh - 80px)",
          backgroundColor: "#050505",
          borderRight: "1px dashed #1a4a1a",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          overflowY: "auto",
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: "#3a6a3a",
            fontFamily: "monospace",
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Categories
        </span>

        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            background: selectedCategory === null ? "rgba(0,255,0,0.08)" : "transparent",
            border: selectedCategory === null ? "1px solid #2a5a2a" : "1px solid transparent",
            borderRadius: "6px",
            color: selectedCategory === null ? "lightgreen" : "green",
            fontFamily: "monospace",
            fontSize: "13px",
            padding: "7px 10px",
            textAlign: "left",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "lightgreen")}
          onMouseLeave={(e) => {
            if (selectedCategory !== null) e.currentTarget.style.color = "green";
          }}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
            }
            style={{
              background:
                selectedCategory === cat.id ? "rgba(0,255,0,0.08)" : "transparent",
              border:
                selectedCategory === cat.id
                  ? "1px solid #2a5a2a"
                  : "1px solid transparent",
              borderRadius: "6px",
              color: selectedCategory === cat.id ? "lightgreen" : "green",
              fontFamily: "monospace",
              fontSize: "13px",
              padding: "7px 10px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "lightgreen")}
            onMouseLeave={(e) => {
              if (selectedCategory !== cat.id) e.currentTarget.style.color = "green";
            }}
          >
            {cat.name}
          </button>
        ))}

        {categories.length === 0 && (
          <span style={{ color: "#2a4a2a", fontFamily: "monospace", fontSize: "11px", marginTop: "8px" }}>
            No categories yet
          </span>
        )}
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft: "200px", flex: 1, padding: "40px 32px" }}>
        <h1
          style={{
            color: "green",
            fontFamily: "monospace",
            marginBottom: "28px",
            fontSize: "22px",
            letterSpacing: "2px",
          }}
        >
          {selectedCategory
            ? `[ ${categories.find((c) => c.id === selectedCategory)?.name ?? "…"} ]`
            : "[ Trading ]"}
        </h1>

        {loading ? (
          <div style={{ color: "green", fontFamily: "monospace" }}>Loading…</div>
        ) : models.length === 0 ? (
          <div style={{ color: "#2a5a2a", fontFamily: "monospace" }}>No models found</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {models.map((model) => (
              <div
                key={model.key}
                onClick={() =>
                  router.push(
                    `/dashboard/offModelViewPage?key=${encodeURIComponent(model.key)}`
                  )
                }
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "#0d0d0d",
                  border: "1px solid #1a3a1a",
                  cursor: "pointer",
                  transition: "border-color 0.2s, transform 0.2s",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#2a6a2a";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#1a3a1a";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                {/* 3D canvas area */}
                <div
                  ref={(el) => {
                    if (el) containerRefs.current.set(model.key, el);
                  }}
                  style={{ width: "100%", height: "220px", position: "relative", backgroundColor: "#080808" }}
                >
                  {loadingModels[model.key] && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "green",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        zIndex: 1,
                      }}
                    >
                      Loading…
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "12px 14px", borderTop: "1px solid #1a3a1a" }}>
                  <div
                    style={{
                      color: "lightgreen",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {model.name}
                  </div>
                  <div
                    style={{
                      color: "#4a8a4a",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      marginBottom: "6px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {model.description}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "green", fontFamily: "monospace", fontSize: "13px" }}>
                      {model.price} €
                    </span>
                    {model.category && (
                      <span
                        style={{
                          color: "#2a5a2a",
                          fontFamily: "monospace",
                          fontSize: "10px",
                          border: "1px solid #1a3a1a",
                          borderRadius: "4px",
                          padding: "2px 6px",
                        }}
                      >
                        {model.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}