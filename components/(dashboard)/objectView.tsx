"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRouter, useSearchParams } from "next/navigation";
import { js } from "three/tsl";

type OffModel = {
  id: string;
  key: string;
  name: string;
  description: string;
  price: number;
};

export default function ObjectView() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const mountRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<OffModel | null>(null);
  const router = useRouter();

  // 1️⃣ Fetch OffModel info
  useEffect(() => {
    if (!key) return;

    fetch(`/api/offModels?key=${encodeURIComponent(key)}`)
      .then((res) => res.json())

      .then((data) => setModel(data.model))
      .catch(console.error);
  }, [key]);

  // 2️⃣ ESC → back
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/dashboard");
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [router]);

  // 3️⃣ Three.js viewer
  useEffect(() => {
    if (!mountRef.current || !model || !key) return;

    const width = 800;
    const height = 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 5, 5);
    scene.add(dir);

    const loader = new GLTFLoader();

    fetch(`/api/getSignedUrl?key=${encodeURIComponent(key)}`)
      .then((res) => res.json())
      .then(({ url }) => {
        loader.load(url, (gltf) => {
          const obj = gltf.scene;
          scene.add(obj);

          const box = new THREE.Box3().setFromObject(obj);
          const center = box.getCenter(new THREE.Vector3());
          obj.position.sub(center);

          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          camera.position.set(
            0,
            maxDim * 0.4,
            (maxDim / (2 * Math.tan(fov / 2))) * 1.5
          );

          controls.target.set(0, 0, 0);
          controls.update();
        });
      });

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [model, key]);

  if (!key) return <div style={{ color: "white" }}>Missing key</div>;
  if (!model) return <div style={{ color: "white" }}>Loading…</div>;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "80vh",
        background: "#000",
      }}
    >
      <div
        style={{ display: "grid", gridTemplateColumns: "800px 300px", gap: 20 }}
      >
        <div ref={mountRef} style={{ width: 800, height: 500 }} />

        <div style={{ padding: 30, background: "#1e1e1e" }}>
          <h3>{model.name}</h3>
          <p>{model.description}</p>
          <strong>{model.price} €</strong>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 20, fontSize: 14 }}>
        Press ESC to exit
      </div>
    </div>
  );
}
