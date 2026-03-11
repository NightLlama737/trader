"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string };
type Model = {
  key: string; id: string; createdAt: string; userId: string;
  name: string; description: string; price: number;
  category?: Category | null; url: string;
};

export default function OffModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const router = useRouter();

  useEffect(() => {
    fetch("/api/getCategories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  // Fetch all models once for counts
  useEffect(() => {
    fetch("/api/getOffModels")
      .then((r) => r.json())
      .then((d) => setAllModels(d.models || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCategory ? `/api/getOffModels?categoryId=${selectedCategory}` : "/api/getOffModels";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const fetched: Model[] = d.models || [];
        setModels(fetched);
        const init: Record<string, boolean> = {};
        fetched.forEach((m) => { init[m.key] = true; });
        setLoadingModels(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => {
    if (!models.length) return;
    const loader = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0e0e0e);
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 200;
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      camera.position.z = 5;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      if (!container.contains(renderer.domElement)) container.appendChild(renderer.domElement);
      renderers.push(renderer);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const light = new THREE.DirectionalLight(0xffffff, 8);
      light.position.set(5, 5, 5);
      scene.add(light);

      fetch(`/api/getSignedUrl?key=${encodeURIComponent(model.key)}`)
        .then((r) => r.json())
        .then(({ url }) => {
          loader.load(
            url,
            (gltf) => {
              const obj = gltf.scene;
              scene.add(obj);
              const box = new THREE.Box3().setFromObject(obj);
              obj.position.sub(box.getCenter(new THREE.Vector3()));
              obj.rotation.y = Math.PI * 1.5;
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const fov = camera.fov * (Math.PI / 180);
              const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;
              camera.position.set(0, 0, cameraZ);
              camera.near = cameraZ / 100;
              camera.far = cameraZ * 100;
              camera.updateProjectionMatrix();
              renderer.render(scene, camera);
              setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
            },
            undefined,
            () => setLoadingModels((prev) => ({ ...prev, [model.key]: false }))
          );
        })
        .catch(() => setLoadingModels((prev) => ({ ...prev, [model.key]: false })));
    });

    return () => { renderers.forEach((r) => r.dispose()); };
  }, [models]);

  const countForCategory = (id: string | null) =>
    id === null
      ? allModels.length
      : allModels.filter((m) => m.category?.id === id).length;

  const selectedName = categories.find((c) => c.id === selectedCategory)?.name;

  return (
    <div style={{ display: "flex", width: "100vw", minHeight: "100vh", paddingTop: 80 }}>

      {/* ── Sidebar ── */}
      <aside style={{
        position: "fixed", left: 0, top: 80,
        width: 210, height: "calc(100vh - 80px)",
        background: "#0a0a0a",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        padding: "32px 16px",
        display: "flex", flexDirection: "column", gap: 4,
        overflowY: "auto", zIndex: 10,
      }}>
        <h1 style={{
fontFamily: "'Cormorant Garamond', Georgia, serif",          fontSize: "1rem", letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgb(212,175,55)", marginBottom: 16,
        }}>Trading</h1>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)", marginBottom: 16,
        }}>
          Categories
        </p>

        {[{ id: null as string | null, name: "All" }, ...categories].map((cat) => {
          const active = selectedCategory === cat.id;
          const count = countForCategory(cat.id);
          return (
            <button
              key={cat.id ?? "__all__"}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.88rem",
                color: active ? "#fff" : "rgba(255,255,255,0.33)",
                background: active ? "rgba(255,255,255,0.04)" : "transparent",
                border: `1px solid ${active ? "rgba(255,255,255,0.13)" : "transparent"}`,
                borderRadius: 2, padding: "7px 10px", textAlign: "left",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.33)"; }}
            >
              <span>{cat.name}</span>
              <span style={{
                fontSize: "0.7rem",
                color: active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10, padding: "1px 7px",
              }}>
                {count}
              </span>
            </button>
          );
        })}

        {categories.length === 0 && (
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.75rem", color: "rgba(255,255,255,0.15)",
            fontStyle: "italic", marginTop: 8,
          }}>
            No categories
          </p>
        )}
      </aside>

      {/* ── Main grid ── */}
      <main style={{ marginLeft: 210, flex: 1, padding: "44px 40px" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 400, fontSize: "1.1rem", color: "#fff",
          marginBottom: 32, letterSpacing: "0.06em",
        }}>
          {selectedName ?? "Trading"}
          <span style={{ color: "rgba(255,255,255,0.22)", marginLeft: 10, fontSize: "0.85rem" }}>
            ({models.length})
          </span>
        </h1>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
            Loading…
          </p>
        ) : models.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.18)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
            No models found
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
            {models.map((model) => (
              <div
                key={model.key}
                onClick={() => router.push(`/dashboard/offModelViewPage?key=${encodeURIComponent(model.key)}`)}
                style={{
                  borderRadius: 2, overflow: "hidden", background: "#111",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer", transition: "border-color 0.22s",
                  display: "flex", flexDirection: "column",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgb(212,175,55)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              >
                <div
                  ref={(el) => { if (el) containerRefs.current.set(model.key, el); }}
                  style={{ width: "100%", height: 200, background: "#0e0e0e", position: "relative" }}
                >
                  {loadingModels[model.key] && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,255,255,0.2)",
                      fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.75rem",
                    }}>
                      Loading…
                    </div>
                  )}
                </div>

                <div style={{ padding: "13px 15px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.88rem", color: "#f5f0e8",
                    marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {model.name}
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.75rem", color: "rgba(245,240,232,0.3)",
                    marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {model.description}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.88rem", color: "rgba(245,240,232,0.6)" }}>
                      {model.price} €
                    </span>
                    {model.category && (
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: "0.62rem", color: "rgba(255,255,255,0.22)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 2, padding: "2px 7px", letterSpacing: "0.05em",
                      }}>
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