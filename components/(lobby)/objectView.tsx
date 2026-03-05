"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRouter, useSearchParams } from "next/navigation";

type Model = { id: string; key: string; url: string };
type OffModelInfo = { id: string; key: string; name: string; description: string; price: number; url?: string };

export default function ObjectView() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const mountRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [offInfo, setOffInfo] = useState<OffModelInfo | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!key) return;
    fetch(`/api/getSignedUrl?key=${encodeURIComponent(key)}`)
      .then((res) => res.json())
      .then((data) => setModel(data.model || { id: key, key, url: data.url }))
      .catch(console.error);
  }, [key]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") router.push("/lobby"); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [router]);

  useEffect(() => {
    if (!mountRef.current || !model) return;
    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const width = container.clientWidth, height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    if (!container.contains(renderer.domElement)) container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 10);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 10);
    dirLight2.position.set(-5, 3, -5);
    scene.add(dirLight2);

    const loader = new GLTFLoader();
    loader.load(model.url, (gltf) => {
      const obj = gltf.scene;
      scene.add(obj);
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      obj.position.sub(center);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
      camera.position.set(0, maxDim * 0.5, cameraZ);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    }, undefined, (err) => console.error("Error loading GLTF:", err));

    const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();

    return () => {
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [model]);

  useEffect(() => {
    if (!model) return;
    fetch(`/api/offModels?key=${encodeURIComponent(model.key)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.model) {
          setOffInfo(data.model);
          setName(data.model.name || "");
          setDescription(data.model.description || "");
          setPrice(data.model.price ?? "");
        }
      })
      .catch(() => {});
  }, [model]);

  const handleSave = async () => {
    if (!model) return;
    setSaving(true);
    try {
      const res = await fetch("/api/updateTrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: model.key,
          name,
          description,
          price: Number(price) || 0,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setOffInfo(data.offModel);
    } catch (err) {
      console.error(err);
      alert("Uložení se nezdařilo.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromTrading = async () => {
    if (!model) return;
    if (!confirm("Odebrat model z obchodu?")) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/offModels?key=${encodeURIComponent(model.key)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Remove failed");
      setOffInfo(null);
      setName("");
      setDescription("");
      setPrice("");
    } catch (err) {
      console.error(err);
      alert("Odebrání se nezdařilo.");
    } finally {
      setRemoving(false);
    }
  };

  const handleDelete = async () => {
    if (!model) return;
    if (!confirm("Opravdu smazat tento model?")) return;
    try {
      const res = await fetch(`/api/models?key=${encodeURIComponent(model.key)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/lobby");
    } catch (err) {
      console.error(err);
      alert("Smazání se nezdařilo.");
    }
  };

  if (!key) return <div style={{ color: "#fff", fontFamily: "monospace" }}>Missing key</div>;
  if (!model) return <div style={{ color: "#fff", fontFamily: "monospace" }}>Loading model…</div>;

  const inputStyle: React.CSSProperties = {
    background: "#111",
    color: "#fff",
    fontFamily: "monospace",
    borderRadius: "4px",
    padding: "6px 10px",
    width: "100%",
    border: "1px solid #2a2a2a",
  };

  const btnStyle = (color = "#fff"): React.CSSProperties => ({
    flex: 1,
    background: "#222",
    color,
    width: "100%",
    borderRadius: 5,
    padding: "8px",
    cursor: "pointer",
    border: "1px solid #333",
    transition: "background 0.2s",
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        background: "#000",
        fontFamily: "monospace",
        position: "relative",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "800px 300px", gap: 20 }}>
        {/* 3D viewer */}
        <div
          ref={mountRef}
          style={{ width: 800, height: 500, background: "#111", borderRadius: "12px", overflow: "hidden" }}
        />

        {/* Sidebar */}
        <div
          style={{
            width: 300,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: "#1a1a1a",
            borderRadius: "12px",
            color: "#fff",
          }}
        >
          {offInfo ? (
            <>
              <div style={{ color: "#555", fontSize: "0.7rem", wordBreak: "break-all" }}>{model.key}</div>

              <label style={{ fontSize: "0.75rem", color: "#888" }}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

              <label style={{ fontSize: "0.75rem", color: "#888" }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }}
              />

              <label style={{ fontSize: "0.75rem", color: "#888" }}>Price</label>
              <input
                value={price as any}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                type="number"
                style={inputStyle}
              />

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  style={btnStyle(saving ? "lightgray" : "white")}
                  onClick={handleSave}
                  disabled={saving}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#2a3a2a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#222")}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  style={btnStyle(removing ? "lightgray" : " white")}
                  onClick={handleRemoveFromTrading}
                  disabled={removing}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#3a2a2a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#222")}
                >
                  {removing ? "Removing…" : "Remove"}
                </button>
              </div>

              <a
                href={model.url}
                download={model.key.split("/").pop()}
                style={{
                  background: "#222",
                  color: "#fff",
                  borderRadius: 5,
                  padding: "8px 12px",
                  textAlign: "center",
                  border: "1px solid #333",
                  textDecoration: "none",
                }}
              >
                Download
              </a>
            </>
          ) : (
            <>
              <h4 style={{color: "white", fontSize: "0.7rem", wordBreak: "break-all", margin: 0 }}>{model.key}</h4>
              <a
                href={model.url}
                download={model.key.split("/").pop()}
                style={{
                  background: "#222",
                  color: "#fff",
                  borderRadius: 5,
                  padding: "8px 12px",
                  fontFamily: "monospace",
                  textAlign: "center",
                  border: "1px solid #333",
                  textDecoration: "none",
                }}
              >
                Download
              </a>
              <button
                style={btnStyle("lightgreen")}
                onClick={() => router.push(`/lobby/addObjectTrade?s3Key=${encodeURIComponent(model.key)}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#2a3a2a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#222")}
              >
                Trade
              </button>
            </>
          )}
        </div>

        {/* Delete row */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            onClick={handleDelete}
            style={{
              background: "#1a1a1a",
              color: "#ff4444",
              borderRadius: 5,
              padding: "8px 16px",
              fontFamily: "monospace",
              cursor: "pointer",
              border: "1px solid #3a1a1a",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a1a1a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
          >
            Delete model
          </button>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 14,
          color: "#333",
          fontFamily: "monospace",
        }}
      >
        Press ESC to exit...
      </div>
    </div>
  );
}