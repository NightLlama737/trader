"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useRouter } from "next/navigation";

type MyModel = {
  key: string;
  url: string;
  isTrading: boolean;
};

export default function SendModelPage({ nickname }: { nickname: string }) {
  const recipient = decodeURIComponent(nickname);
  const router = useRouter();

  const [models, setModels] = useState<MyModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);

  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rendererRefs = useRef<Map<string, THREE.WebGLRenderer>>(new Map());
  const [modelLoading, setModelLoading] = useState<Record<string, boolean>>({});

  // Get recipient user ID
  useEffect(() => {
    fetch("/api/findUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrNick: recipient }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.user) setRecipientId(d.user.id); })
      .catch(console.error);
  }, [recipient]);

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

  useEffect(() => {
    if (!models.length) return;
    const loader = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      const old = rendererRefs.current.get(model.key);
      if (old) { old.dispose(); container.innerHTML = ""; }

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d0d0d);
      const w = container.clientWidth || 200;
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
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;
            camera.position.set(0, 0, cameraZ);
            camera.near = cameraZ / 100;
            camera.far = cameraZ * 100;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
            setModelLoading((prev) => ({ ...prev, [model.key]: false }));
          }, undefined, () => setModelLoading((prev) => ({ ...prev, [model.key]: false })));
        })
        .catch(() => setModelLoading((prev) => ({ ...prev, [model.key]: false })));
    });

    return () => { renderers.forEach((r) => r.dispose()); };
  }, [models]);

  const handleSend = async () => {
    if (!selected || !recipientId) return;
    setSending(true);
    try {
      const res = await fetch("/api/giftModel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: recipientId, modelKey: selected, message: message.trim() || undefined }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => router.back(), 2000);
      }
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
        }}>
          ✓
        </div>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "1.1rem",
          color: "rgba(245,240,232,0.7)",
          margin: 0,
        }}>
          Model sent to <span style={{ color: "rgb(212,175,55)" }}>{recipient}</span>
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      paddingTop: 100,
      padding: "100px 60px 140px",
    }}>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 32,
      }}>
        <div>
          <h2 style={{
            margin: 0,
            color: "#f5f0e8",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 400,
            letterSpacing: "0.03em",
          }}>
            Send a Model
          </h2>
          <p style={{
            margin: "6px 0 0",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.9rem",
            color: "rgba(245,240,232,0.35)",
          }}>
            to <span style={{ color: "rgb(212,175,55)" }}>{recipient}</span>
          </p>
        </div>
        <button
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 2,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.85rem",
            padding: "7px 20px",
            cursor: "pointer",
          }}
          onClick={() => router.back()}
        >
          ← Back
        </button>
      </div>

      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: "0.82rem",
        color: "rgba(255,255,255,0.2)",
        marginBottom: 28,
        letterSpacing: "0.03em",
      }}>
        Select a model to gift. The recipient will receive a notification and can accept or decline.
      </p>

      {/* Grid */}
      {loading ? (
        <p style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
          Loading your models…
        </p>
      ) : models.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
          You have no models to send.
        </p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 32,
        }}>
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
                    ? "1px solid rgb(212,175,55)"
                    : "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer",
                  transition: "border-color 0.18s, box-shadow 0.18s",
                  position: "relative",
                  boxShadow: isSelected ? "0 0 20px rgba(212,175,55,0.08)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                {isSelected && (
                  <div style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    background: "rgba(212,175,55,0.12)",
                    border: "1px solid rgba(212,175,55,0.5)",
                    borderRadius: 2,
                    padding: "2px 8px",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.6rem",
                    color: "rgb(212,175,55)",
                    letterSpacing: "0.06em",
                    pointerEvents: "none",
                  }}>
                    Selected
                  </div>
                )}

                <div
                  ref={(el) => { if (el) containerRefs.current.set(model.key, el); }}
                  style={{ width: "100%", height: 160, background: "#0d0d0d", position: "relative" }}
                >
                  {modelLoading[model.key] && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,255,255,0.15)",
                      fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.72rem",
                    }}>
                      Loading…
                    </div>
                  )}
                </div>

                <div style={{
                  padding: "9px 12px",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.68rem",
                    color: "rgba(255,255,255,0.25)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 140,
                  }}>
                    {model.key.split("/").pop()}
                  </span>
                  {model.isTrading && (
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "0.58rem",
                      color: "rgb(212,175,55)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      borderRadius: 2,
                      padding: "1px 5px",
                      letterSpacing: "0.05em",
                      flexShrink: 0,
                    }}>
                      trading
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message input */}
      {selected && (
        <div style={{ maxWidth: 400, marginBottom: 24 }}>
          <label style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.68rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(245,240,232,0.35)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}>
            Message (optional)
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="A personal note…"
              maxLength={200}
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1rem",
                fontWeight: 300,
                background: "transparent",
                color: "#f5f0e8",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                padding: "8px 0",
                outline: "none",
                caretColor: "#f5f0e8",
                width: "100%",
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
            />
          </label>
        </div>
      )}

      {/* Send bar */}
      {selected && (
        <div style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          background: "rgba(10,10,10,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
          padding: "16px 60px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}>
          <div>
            <p style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.9rem",
              color: "rgba(245,240,232,0.4)",
            }}>
              1 model selected
            </p>
            <p style={{
              margin: "2px 0 0",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.72rem",
              color: "rgba(245,240,232,0.2)",
            }}>
              {selected.split("/").pop()}
            </p>
          </div>
          <button
            style={{
              background: "transparent",
              border: "1px solid rgba(245,240,232,0.25)",
              borderRadius: 2,
              color: "#f5f0e8",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.95rem",
              letterSpacing: "0.07em",
              padding: "10px 32px",
              cursor: sending ? "not-allowed" : "pointer",
              opacity: sending ? 0.5 : 1,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => { if (!sending) e.currentTarget.style.borderColor = "rgb(212,175,55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,240,232,0.25)"; }}
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? "Sending…" : `Gift to ${recipient}`}
          </button>
        </div>
      )}
    </div>
  );
}