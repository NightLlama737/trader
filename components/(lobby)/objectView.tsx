"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRouter, useSearchParams } from "next/navigation";

type Model = { id: string; key: string; url: string };
type OffModelInfo = { id: string; key: string; name: string; description: string; price: number };

const LABEL: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "0.65rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(245,240,232,0.3)",
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const INPUT: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "0.95rem",
  fontWeight: 300,
  background: "transparent",
  color: "#f5f0e8",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  padding: "7px 0",
  outline: "none",
  caretColor: "#f5f0e8",
  width: "100%",
};

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
      .then((r) => r.json())
      .then((d) => setModel(d.model || { id: key, key, url: d.url }))
      .catch(console.error);
  }, [key]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") router.push("/lobby"); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [router]);

  useEffect(() => {
    if (!mountRef.current || !model) return;
    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e0e);
    const w = container.clientWidth, h = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    if (!container.contains(renderer.domElement)) container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const d1 = new THREE.DirectionalLight(0xffffff, 10); d1.position.set(5, 5, 5); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xffffff, 6); d2.position.set(-5, 3, -5); scene.add(d2);
    const loader = new GLTFLoader();
    loader.load(model.url, (gltf) => {
      const obj = gltf.scene; scene.add(obj);
      const box = new THREE.Box3().setFromObject(obj);
      obj.position.sub(box.getCenter(new THREE.Vector3()));
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      camera.position.set(0, maxDim * 0.5, Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5);
      camera.lookAt(0, 0, 0); controls.target.set(0, 0, 0); controls.update();
    }, undefined, console.error);
    const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
    return () => { if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement); renderer.dispose(); };
  }, [model]);

  useEffect(() => {
    if (!model) return;
    fetch(`/api/offModels?key=${encodeURIComponent(model.key)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.model) {
          setOffInfo(d.model);
          setName(d.model.name || "");
          setDescription(d.model.description || "");
          setPrice(d.model.price ?? "");
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
        body: JSON.stringify({ key: model.key, name, description, price: Number(price) || 0 }),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setOffInfo(d.offModel);
    } catch { alert("Save failed."); }
    finally { setSaving(false); }
  };

  const handleRemoveFromTrading = async () => {
    if (!model || !confirm("Remove from trading?")) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/offModels?key=${encodeURIComponent(model.key)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setOffInfo(null); setName(""); setDescription(""); setPrice("");
    } catch { alert("Remove failed."); }
    finally { setRemoving(false); }
  };

  const handleDelete = async () => {
    if (!model || !confirm("Permanently delete this model?")) return;
    const res = await fetch(`/api/models?key=${encodeURIComponent(model.key)}`, { method: "DELETE" });
    if (res.ok) router.push("/lobby");
    else alert("Delete failed.");
  };

  if (!key) return <p style={{ color: "#f5f0e8", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Missing key</p>;
  if (!model) return <p style={{ color: "#f5f0e8", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Loading…</p>;

  return (
    <div style={{
      width: "80vw", height: "90vh",
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "80vh", background: "RGBA(10,10,10)",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      position: "relative", padding: "40px 20px",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1400px 280px", gap: 20 }}>

        {/* 3D viewer */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            ref={mountRef}
            style={{
              width: "1200px", height: "600px",
              background: "#0e0e0e",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid rgb(212,175,55)",
            }}
          />
          <button className="btn-danger" style={{ alignSelf: "flex-start" }} onClick={handleDelete}>
            Delete Model
          </button>
        </div>

        {/* Sidebar */}
        <div style={{
          padding: "28px 20px",
          height: "550px",
          display: "flex", flexDirection: "column", gap: 18,
          background: "#111",
              border: "1px solid rgba(245,240,232,0.15)",
          borderRadius: 2,
        }}>
          <p style={{
            color: "rgba(245,240,232,0.18)",
            fontSize: "0.68rem",
            letterSpacing: "0.04em",
            wordBreak: "break-all",
            lineHeight: 1.5,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            {model.key}
          </p>

          {offInfo ? (
            <>
              <label style={LABEL}>
                Name
                <input style={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label style={LABEL}>
                Description
                <textarea
                 value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...INPUT, resize: "none", minHeight: 70 }}
                />
              </label>
              <label style={LABEL}>
                Price (€)
                <input
                  type="number"
                  style={INPUT}
                  value={price as any}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button className="btn-danger" onClick={handleRemoveFromTrading} disabled={removing}>
                  {removing ? "Removing…" : "Remove from Trading"}
                </button>
              </div>

              <a
                href={model.url}
                download={model.key.split("/").pop()}
                className="btn-primary"
                style={{ marginTop: 4, textAlign: "center" }}
              >
                Download
              </a>
            </>
          ) : (
            <>
              <a
                href={model.url}
                download={model.key.split("/").pop()}
                className="btn-ghost"
                style={{ border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}
              >
                Download
              </a>
              <button
                className="btn-primary"
                onClick={() => router.push(`/lobby/addObjectTrade?s3Key=${encodeURIComponent(model.key)}`)}
              >
                List for Trading
              </button>
            </>
          )}
        </div>
      </div>

      <p style={{
        position: "absolute",
        bottom: "0",
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: "0.72rem",
        color: "white",
        letterSpacing: "0.1em",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}>
        Press ESC to exit
      </p>
    </div>
  );
}