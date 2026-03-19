"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRouter, useSearchParams } from "next/navigation";

type OffModel = { id: string; key: string; name: string; description: string; price: number; userId: string };

export default function ObjectView() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const [model, setModel] = useState<OffModel | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/getUserId").then((r) => r.json()).then((d) => setMyUserId(d.userId)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!key) return;
    fetch(`/api/offModels?key=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d) => setModel(d.model))
      .catch(console.error);
  }, [key]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") router.push("/dashboard"); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [router]);

  useEffect(() => {
    if (!mountRef.current || !model || !key) return;
    const container = mountRef.current;

    if (rendererRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    container.innerHTML = "";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e0e);
    const camera = new THREE.PerspectiveCamera(60, 800 / 500, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 500);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const d = new THREE.DirectionalLight(0xffffff, 8); d.position.set(5, 5, 5); scene.add(d);

    fetch(`/api/getSignedUrl?key=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then(({ url }) => {
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
          const obj = gltf.scene; scene.add(obj);
          const box = new THREE.Box3().setFromObject(obj);
          obj.position.sub(box.getCenter(new THREE.Vector3()));
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          camera.position.set(0, maxDim * 0.4, (maxDim / (2 * Math.tan(fov / 2))) * 1.5);
          controls.target.set(0, 0, 0); controls.update();
        });
      });

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      rendererRef.current = null;
      container.innerHTML = "";
    };
  }, [model, key]);

  const handlePurchase = async () => {
    if (!model) return;
    setPurchasing(true);
    setPurchaseMsg(null);
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offModelId: model.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setPurchaseMsg({ text: "Purchase request sent! The seller will be notified.", ok: true });
      } else {
        setPurchaseMsg({ text: data.error || "Failed to send purchase request", ok: false });
      }
    } catch {
      setPurchaseMsg({ text: "Network error", ok: false });
    }
    setPurchasing(false);
  };

  const isOwner = myUserId && model && myUserId === model.userId;

  if (!key) return <p style={{ color: "#f5f0e8", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Missing key</p>;
  if (!model) return <p style={{ color: "#f5f0e8", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Loading…</p>;

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "80vh", background: "#0a0a0a",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      position: "relative",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "800px 300px", gap: 20 }}>
        <div ref={mountRef} style={{ width: 800, height: 500, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }} />

        <div style={{
          padding: "32px 28px", background: "#111",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, fontSize: "1.2rem", color: "#fff" }}>
            {model.name}
          </h3>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "rgba(245,240,232,0.5)", fontSize: "0.95rem", lineHeight: 1.65 }}>
            {model.description}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "rgba(245,240,232,0.7)", fontSize: "1.3rem", marginTop: "auto" }}>
            {model.price} €
          </p>

          {purchaseMsg && (
            <div style={{
              padding: "10px 14px",
              background: purchaseMsg.ok ? "rgba(212,175,55,0.07)" : "rgba(210,90,90,0.07)",
              border: `1px solid ${purchaseMsg.ok ? "rgba(212,175,55,0.3)" : "rgba(210,90,90,0.3)"}`,
              borderRadius: 2,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.82rem",
              color: purchaseMsg.ok ? "rgb(212,175,55)" : "rgba(210,90,90,0.9)",
              lineHeight: 1.5,
            }}>
              {purchaseMsg.text}
            </div>
          )}

          {!isOwner && !purchaseMsg?.ok && (
            <button
              className="btn-primary"
              style={{ marginTop: 4 }}
              onClick={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? "Sending request…" : "Request Purchase"}
            </button>
          )}

          {isOwner && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 2,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.25)",
              fontStyle: "italic",
            }}>
              This is your listing
            </div>
          )}
        </div>
      </div>

      <p style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", color: "rgba(245,240,232,0.12)", letterSpacing: "0.1em", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        Press ESC to exit
      </p>
    </div>
  );
}