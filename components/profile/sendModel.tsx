"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useParams, useRouter } from "next/navigation";

type MyModel = {
  key: string;
  url: string;
  isTrading: boolean;
};

export default function SendModelPage({ nickname }: { nickname: string }) {
  const recipient = decodeURIComponent(nickname);
  const router    = useRouter();

  const [models, setModels]         = useState<MyModel[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<string | null>(null);
  const [sending, setSending]       = useState(false);

  const containerRefs  = useRef<Map<string, HTMLDivElement>>(new Map());
  const rendererRefs   = useRef<Map<string, THREE.WebGLRenderer>>(new Map());
  const [modelLoading, setModelLoading] = useState<Record<string, boolean>>({});

  /* ── Fetch my models ── */
  useEffect(() => {
    fetch("/api/getMyModels")
      .then((r) => r.json())
      .then((d) => {
        const list: MyModel[] = d.models || [];
        setModels(list);
        const init: Record<string, boolean> = {};
        list.forEach((m) => { init[m.key] = true; });
        setModelLoading(init);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Three.js renderers ── */
  useEffect(() => {
    if (!models.length) return;
    const loader    = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      // clean up existing renderer for this slot
      const old = rendererRefs.current.get(model.key);
      if (old) { old.dispose(); container.innerHTML = ""; }

      const scene  = new THREE.Scene();
      scene.background = new THREE.Color(0x0e0e0e);
      const w = container.clientWidth  || 200;
      const h = container.clientHeight || 160;
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      container.appendChild(renderer.domElement);
      renderers.push(renderer);
      rendererRefs.current.set(model.key, renderer);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const dl = new THREE.DirectionalLight(0xffffff, 8);
      dl.position.set(5, 5, 5);
      scene.add(dl);

      fetch(`/api/getSignedUrl?key=${encodeURIComponent(model.key)}`)
        .then((r) => r.json())
        .then(({ url }) => {
          loader.load(url, (gltf) => {
            const obj = gltf.scene;
            scene.add(obj);
            const box = new THREE.Box3().setFromObject(obj);
            obj.position.sub(box.getCenter(new THREE.Vector3()));
            obj.rotation.y = Math.PI * 1.5;
            const size   = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov    = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;
            camera.position.set(0, 0, cameraZ);
            camera.near = cameraZ / 100;
            camera.far  = cameraZ * 100;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
            setModelLoading((prev) => ({ ...prev, [model.key]: false }));
          }, undefined, () => setModelLoading((prev) => ({ ...prev, [model.key]: false })));
        })
        .catch(() => setModelLoading((prev) => ({ ...prev, [model.key]: false })));
    });

    return () => { renderers.forEach((r) => r.dispose()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models]);

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    // TODO: implement actual send logic
    console.log("Send model", selected, "to", recipient);
    setTimeout(() => {
      setSending(false);
      router.back();
    }, 800);
  };

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Send a Model</h2>
          <p style={S.subtitle}>
            to&nbsp;<span style={S.recipientName}>{recipient}</span>
          </p>
        </div>
        <button style={S.cancelBtn} onClick={() => router.back()}>
          Cancel
        </button>
      </div>

      {/* ── Instruction ── */}
      <p style={S.hint}>Click a model to select it, then press Send.</p>

      {/* ── Grid ── */}
      {loading ? (
        <p style={S.muted}>Loading your models…</p>
      ) : models.length === 0 ? (
        <p style={S.muted}>You have no models to send.</p>
      ) : (
        <div style={S.grid}>
          {models.map((model) => {
            const isSelected = selected === model.key;
            return (
              <div
                key={model.key}
                onClick={() => setSelected(isSelected ? null : model.key)}
                style={{
                  borderRadius: 2,
                  overflow: "hidden",
                  background: "#111",
                  border: isSelected
                    ? "2px solid rgb(212,175,55)"
                    : "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer",
                  transition: "border-color 0.18s, transform 0.18s",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                  position: "relative",
                }}
              >
                {/* Selected badge */}
                {isSelected && (
                  <div style={S.selectedBadge}>✓ Selected</div>
                )}

                {/* Three.js viewport */}
                <div
                  ref={(el) => { if (el) containerRefs.current.set(model.key, el); }}
                  style={{ width: "100%", height: 160, background: "#0e0e0e", position: "relative" }}
                >
                  {modelLoading[model.key] && (
                    <div style={S.loadingLabel}>Loading…</div>
                  )}
                </div>

                {/* Key label */}
                <div style={S.modelFooter}>
                  <span style={S.modelKey}>
                    {model.key.split("/").pop()}
                  </span>
                  {model.isTrading && (
                    <span style={S.tradingBadge}>trading</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Send bar ── */}
      {selected && (
        <div style={S.sendBar}>
          <p style={S.sendBarText}>
            1 model selected
          </p>
          <button
            style={{
              ...S.sendBtn,
              opacity: sending ? 0.5 : 1,
              cursor: sending ? "not-allowed" : "pointer",
            }}
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending…" : `Send to ${recipient}`}
          </button>
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    paddingTop: 100,
    padding: "100px 60px 120px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    margin: 0,
    color: "#f5f0e8",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "1.5rem",
    fontWeight: 400,
    letterSpacing: "0.03em",
  },
  subtitle: {
    margin: "4px 0 0",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.9rem",
    color: "rgba(245,240,232,0.35)",
  },
  recipientName: {
    color: "rgb(212,175,55)",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 2,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.85rem",
    padding: "7px 20px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  hint: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.82rem",
    color: "rgba(255,255,255,0.2)",
    marginBottom: 28,
    letterSpacing: "0.03em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 14,
  },
  muted: {
    color: "rgba(255,255,255,0.2)",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontStyle: "italic",
    fontSize: "0.95rem",
  },
  selectedBadge: {
    position: "absolute",
    top: 8, right: 8, zIndex: 2,
    background: "rgba(212,175,55,0.15)",
    border: "1px solid rgba(212,175,55,0.5)",
    borderRadius: 2,
    padding: "2px 8px",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.6rem",
    color: "rgb(212,175,55)",
    letterSpacing: "0.06em",
    pointerEvents: "none",
  },
  loadingLabel: {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "rgba(255,255,255,0.2)",
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.72rem",
  },
  modelFooter: {
    padding: "9px 12px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modelKey: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.68rem",
    color: "rgba(255,255,255,0.3)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 160,
  },
  tradingBadge: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.58rem",
    color: "rgb(212,175,55)",
    border: "1px solid rgba(212,175,55,0.3)",
    borderRadius: 2,
    padding: "1px 5px",
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  sendBar: {
    position: "fixed",
    bottom: 0, left: 0, right: 0,
    background: "rgba(10,10,10,0.96)",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(12px)",
    padding: "16px 60px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
  },
  sendBarText: {
    margin: 0,
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.9rem",
    color: "rgba(245,240,232,0.4)",
  },
  sendBtn: {
    background: "transparent",
    border: "1px solid rgba(245,240,232,0.25)",
    borderRadius: 2,
    color: "#f5f0e8",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.95rem",
    letterSpacing: "0.07em",
    padding: "10px 32px",
    transition: "all 0.2s",
  },
};