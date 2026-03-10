"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRouter, useSearchParams } from "next/navigation";

type OffModel = { id: string; key: string; name: string; description: string; price: number };

export default function ObjectView() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const [model, setModel] = useState<OffModel | null>(null);
  const router = useRouter();

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

    // Cleanup previous
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
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "rgba(245,240,232,0.7)", fontSize: "1.1rem", marginTop: "auto" }}>
            {model.price} €
          </p>
          <button className="btn-primary" style={{ marginTop: 8 }}>Purchase</button>
        </div>
      </div>

      <p style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", color: "rgba(245,240,232,0.12)", letterSpacing: "0.1em", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        Press ESC to exit
      </p>
    </div>
  );
}