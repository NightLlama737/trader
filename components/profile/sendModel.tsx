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

  // GET USER (recipient)
  useEffect(() => {
    fetch("/api/findUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrNick: recipient }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setRecipientId(d.user.id);
      })
      .catch(console.error);
  }, [recipient]);

  useEffect(() => {
    fetch("/api/getMyModels")
      .then((r) => r.json())
      .then((d) => {
        const list: MyModel[] = d.models || [];
        setModels(list);

        const init: Record<string, boolean> = {};
        list.forEach((m) => {
          init[m.key] = true;
        });

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
      if (old) {
        old.dispose();
        container.innerHTML = "";
      }

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

              setModelLoading((prev) => ({
                ...prev,
                [model.key]: false,
              }));
            },
            undefined,
            () =>
              setModelLoading((prev) => ({
                ...prev,
                [model.key]: false,
              }))
          );
        })
        .catch(() =>
          setModelLoading((prev) => ({
            ...prev,
            [model.key]: false,
          }))
        );
    });

    return () => {
      renderers.forEach((r) => r.dispose());
    };
  }, [models]);

  const handleSend = async () => {
    if (!selected || !recipientId) return;

    setSending(true);

    try {
      const res = await fetch("/api/giftModel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: recipientId,
          modelKey: selected,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("SEND ERROR:", data);
        return;
      }

      setSent(true);

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err) {
      console.error("SEND ERROR:", err);
    }

    setSending(false);
  };

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
          ✓
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.1rem", color: "rgba(245,240,232,0.7)", margin: 0 }}>
          Model sent to <span style={{ color: "rgb(212,175,55)" }}>{recipient}</span>
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingTop: 100, padding: "100px 60px 140px" }}>

      {/* HEADER (BEZE ZMĚNY CSS) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0, color: "#f5f0e8", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", fontWeight: 400, letterSpacing: "0.03em" }}>
            Send a Model
          </h2>
          <p style={{ margin: "6px 0 0", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.9rem", color: "rgba(245,240,232,0.35)" }}>
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

      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.82rem", color: "rgba(255,255,255,0.2)", marginBottom: 28 }}>
        Select a model to gift.
      </p>

      {/* GRID */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {models.map((model) => {
            const isSelected = selected === model.key;

            return (
              <div
                key={model.key}
                onClick={() => setSelected(isSelected ? null : model.key)}
                style={{
                  border: isSelected ? "1px solid rgb(212,175,55)" : "1px solid rgba(255,255,255,0.07)",
                  background: "#111",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div
                  ref={(el) => {
                    if (el) containerRefs.current.set(model.key, el);
                  }}
                  style={{ height: 160 }}
                />

                <div style={{ padding: 10 }}>
                  {model.key.split("/").pop()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEND BAR */}
      {selected && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0a0a0a", padding: 16, display: "flex", justifyContent: "space-between" }}>
          <button onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : `Gift to ${recipient}`}
          </button>
        </div>
      )}
    </div>
  );
}