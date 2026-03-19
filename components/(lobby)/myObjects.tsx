"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type Model = {
  key: string;
  id: string;
  lastModified?: string;
  size?: number;
  isTrading: boolean;
};

type RenderedImage = {
  id: string;
  key: string;
  url: string;
  createdAt: string;
};

type FilterMode = "all" | "trading" | "not-trading" | "renders";

export default function MyObjects() {
  const [models, setModels] = useState<Model[]>([]);
  const [renders, setRenders] = useState<RenderedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const [loadingRenders, setLoadingRenders] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [lightboxImg, setLightboxImg] = useState<RenderedImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const router = useRouter();

  useEffect(() => {
    fetch("/api/getMyModels")
      .then((r) => r.json())
      .then((d) => {
        setModels(d.models || []);
        const init: Record<string, boolean> = {};
        (d.models || []).forEach((m: Model) => { init[m.key] = true; });
        setLoadingModels(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (filter !== "renders") return;
    setLoadingRenders(true);
    fetch("/api/getRenderedImage")
      .then((r) => r.json())
      .then((d) => setRenders(d.images || []))
      .catch(console.error)
      .finally(() => setLoadingRenders(false));
  }, [filter]);

  const filtered = models.filter((m) => {
    if (filter === "trading") return m.isTrading;
    if (filter === "not-trading") return !m.isTrading;
    return true;
  });

  useEffect(() => {
    if (filter === "renders") return;
    if (!filtered.length) return;

    const loader = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    filtered.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);
      const w = container.clientWidth || 260;
      const h = container.clientHeight || 260;
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      if (!container.contains(renderer.domElement)) container.appendChild(renderer.domElement);
      renderers.push(renderer);

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const light = new THREE.DirectionalLight(0xffffff, 10);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, filter]);

  const handleDeleteRender = async (img: RenderedImage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === img.id) return;
    setDeletingId(img.id);
    try {
      const res = await fetch(`/api/getRenderedImage?id=${img.id}`, { method: "DELETE" });
      if (res.ok) {
        setRenders((prev) => prev.filter((r) => r.id !== img.id));
        if (lightboxImg?.id === img.id) setLightboxImg(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const FILTERS: { mode: FilterMode; label: string; icon: string }[] = [
    { mode: "all",         label: "All Objects",    icon: "◈" },
    { mode: "trading",     label: "In Trading",     icon: "◆" },
    { mode: "not-trading", label: "Not in Trading", icon: "◇" },
    { mode: "renders",     label: "Renders",        icon: "⬡" },
  ];

  const counts: Record<FilterMode, number> = {
    all:           models.length,
    trading:       models.filter((m) => m.isTrading).length,
    "not-trading": models.filter((m) => !m.isTrading).length,
    renders:       renders.length,
  };

  const mainTitle =
    filter === "all" ? "All Objects"
    : filter === "trading" ? "In Trading"
    : filter === "not-trading" ? "Not in Trading"
    : "Renders";

  if (loading) return (
    <p style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      Loading models…
    </p>
  );

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
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "1rem", letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgb(212,175,55)", marginBottom: 16,
        }}>My models</h1>

        {FILTERS.map(({ mode, label, icon }) => {
          const active = filter === mode;
          return (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.88rem",
                color: active ? "#fff" : "rgba(255,255,255,0.33)",
                background: active ? "rgba(255,255,255,0.04)" : "transparent",
                border: `1px solid ${active ? "rgba(255,255,255,0.13)" : "transparent"}`,
                borderRadius: 2, padding: "7px 10px", textAlign: "left",
                cursor: "pointer", transition: "all 0.2s",
                marginTop: mode === "renders" ? 10 : 0,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.33)";
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>{icon}</span>
                {label}
              </span>
              <span style={{
                fontSize: "0.7rem",
                color: active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10, padding: "1px 7px",
              }}>
                {mode === "renders" && filter !== "renders" ? "…" : counts[mode]}
              </span>
            </button>
          );
        })}

        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "14px 0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "rgb(212,175,55)",
              boxShadow: "0 0 5px rgba(212,175,55,0.5)",
              flexShrink: 0,
            }} />
            <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.68rem" }}>
              listed for trade
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              flexShrink: 0,
            }} />
            <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.68rem" }}>
              not listed
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main grid ── */}
      <main style={{ marginLeft: 210, flex: 1, padding: "44px 40px" }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 400, fontSize: "1.1rem", color: "#fff",
          marginBottom: 32, letterSpacing: "0.06em",
        }}>
          {mainTitle}
          <span style={{ color: "rgba(255,255,255,0.22)", marginLeft: 10, fontSize: "0.85rem" }}>
            ({filter === "renders" ? renders.length : counts[filter]})
          </span>
        </h1>

        {/* ── Renders Grid ── */}
        {filter === "renders" && (
          <>
            {loadingRenders ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Loading renders…
              </p>
            ) : renders.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.18)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
                No renders yet
              </p>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 14,
              }}>
                {renders.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setLightboxImg(img)}
                    style={{
                      position: "relative",
                      borderRadius: 2,
                      overflow: "hidden",
                      background: "#111",
                      border: "1px solid rgba(212,175,55,0.15)",
                      cursor: "zoom-in",
                      transition: "transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease",
                      aspectRatio: "1 / 1",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.035)";
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.55)";
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.5)";
                      const btn = e.currentTarget.querySelector<HTMLButtonElement>(".delete-btn");
                      if (btn) btn.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.15)";
                      e.currentTarget.style.boxShadow = "none";
                      const btn = e.currentTarget.querySelector<HTMLButtonElement>(".delete-btn");
                      if (btn) btn.style.opacity = "0";
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt="render"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />

                    {/* Delete button */}
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteRender(img, e)}
                      disabled={deletingId === img.id}
                      style={{
                        position: "absolute", top: 7, right: 7,
                        opacity: 0,
                        transition: "opacity 0.18s ease",
                        background: "rgba(10,10,10,0.82)",
                        border: "1px solid rgba(255,80,80,0.35)",
                        borderRadius: 2,
                        color: deletingId === img.id ? "rgba(255,80,80,0.4)" : "rgba(255,80,80,0.85)",
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: "0.7rem",
                        padding: "3px 9px",
                        cursor: deletingId === img.id ? "default" : "pointer",
                        letterSpacing: "0.05em",
                        backdropFilter: "blur(4px)",
                        zIndex: 3,
                      }}
                    >
                      {deletingId === img.id ? "…" : "delete"}
                    </button>

                    {/* Date label */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "18px 10px 8px",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "0.63rem",
                      color: "rgba(255,255,255,0.3)",
                      pointerEvents: "none",
                    }}>
                      {new Date(img.createdAt).toLocaleDateString("cs-CZ", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Models Grid ── */}
        {filter !== "renders" && (
          <>
            {filtered.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.18)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
                No models here
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
                {filtered.map((model) => (
                  <div
                    key={model.key}
                    onClick={() => router.push(`/lobby/objectViewPage?key=${encodeURIComponent(model.key)}`)}
                    style={{
                      borderRadius: 2, overflow: "hidden", background: "#111",
                      border: model.isTrading
                        ? "1px solid rgba(212,175,55,0.25)"
                        : "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer", transition: "border-color 0.22s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = model.isTrading
                        ? "rgb(212,175,55)"
                        : "rgba(255,255,255,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = model.isTrading
                        ? "rgba(212,175,55,0.25)"
                        : "rgba(255,255,255,0.06)";
                    }}
                  >
                    {model.isTrading && (
                      <div style={{
                        position: "absolute", top: 8, right: 8, zIndex: 2,
                        background: "rgba(212,175,55,0.12)",
                        border: "1px solid rgba(212,175,55,0.45)",
                        borderRadius: 2, padding: "2px 7px",
                        fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.62rem",
                        color: "rgb(212,175,55)", letterSpacing: "0.06em",
                        pointerEvents: "none",
                      }}>
                        trading
                      </div>
                    )}

                    <div
                      ref={(el) => { if (el) containerRefs.current.set(model.key, el); }}
                      style={{ width: "100%", height: 220, background: "#0e0e0e", position: "relative" }}
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
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
            cursor: "zoom-out",
            animation: "fadeIn 0.18s ease",
          }}
        >
          <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "min(90vw, 900px)",
              maxHeight: "88vh",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid rgba(212,175,55,0.25)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
              animation: "scaleIn 0.18s ease",
            }}
          >
            <style>{`@keyframes scaleIn { from { transform: scale(0.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImg.url}
              alt="render"
              style={{ display: "block", maxWidth: "100%", maxHeight: "88vh", objectFit: "contain" }}
            />
            {/* Top bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0,
              padding: "10px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(rgba(0,0,0,0.7), transparent)",
            }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "0.7rem", color: "rgba(255,255,255,0.35)",
              }}>
                {new Date(lightboxImg.createdAt).toLocaleDateString("cs-CZ", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={(e) => handleDeleteRender(lightboxImg, e)}
                  disabled={deletingId === lightboxImg.id}
                  style={{
                    background: "rgba(10,10,10,0.7)",
                    border: "1px solid rgba(255,80,80,0.35)",
                    borderRadius: 2,
                    color: "rgba(255,80,80,0.8)",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.7rem", padding: "3px 10px",
                    cursor: "pointer", letterSpacing: "0.05em",
                  }}
                >
                  {deletingId === lightboxImg.id ? "deleting…" : "delete"}
                </button>
                <button
                  onClick={() => setLightboxImg(null)}
                  style={{
                    background: "rgba(10,10,10,0.7)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 2,
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.7rem", padding: "3px 10px",
                    cursor: "pointer",
                  }}
                >
                  close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}