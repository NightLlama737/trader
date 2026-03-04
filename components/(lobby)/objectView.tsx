"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRouter, useSearchParams } from "next/navigation";

type Model = {
  id: string;
  key: string;
  url: string; // presigned URL
};

type OffModelInfo = {
  id: string;
  key: string;
  name: string;
  description: string;
  price: number;
  url?: string;
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
  const router = useRouter();

  // 1️⃣ Fetch presigned URL
  useEffect(() => {
    if (!key) return;

    fetch(`/api/getSignedUrl?key=${encodeURIComponent(key)}`)
      .then((res) => res.json())
      .then((data) => setModel(data.model || { id: key, key, url: data.url }))
      .catch(console.error);
  }, [key]);

  // 2️⃣ ESC → zpět do lobby
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/lobby");
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [router]);

  // 3️⃣ Three.js render
  useEffect(() => {
    if (!mountRef.current || !model) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    if (!container.contains(renderer.domElement)) {
      container.appendChild(renderer.domElement);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const loader = new GLTFLoader();
    loader.load(
      model.url,
      (gltf) => {
        const obj = gltf.scene;
        scene.add(obj);

        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);

        // Fit camera
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        camera.position.set(0, maxDim * 0.5, cameraZ);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
      },
      undefined,
      (err) => console.error("Error loading GLTF:", err)
    );

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup renderer
    return () => {
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [model]);

  // 4️⃣ Fetch OffModel info (if already in trading)
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
          // if API returned url it can be used by Three view but we keep model.url
        }
      })
      .catch(() => {
        // ignore — means not in trading
      });
  }, [model]);

  if (!key) return <div className="text-white">Missing key</div>;
  if (!model) return <div className="text-white">Loading model…</div>;

  return (
    <div className="flex justify-center items-center h-[80vh] bg-gradient-to-br from-blue-500 to-pink-400 rounded-2xl shadow-lg">
      <div
        className="grid grid-cols-[800px_300px] gap-5"
      >
        {/* 3D view */}
        <div
          ref={mountRef}
          className="w-[800px] h-[500px] border border-gray-800 bg-gray-900 rounded-xl shadow-md"
        />

        {/* Sidebar */}
        <div
          className="w-[300px] p-12 flex flex-col gap-5 border border-gray-800 bg-black bg-opacity-60 text-white rounded-xl glass-morph"
        >
          {offInfo ? (
            <div className="flex flex-col gap-2">
              <div className="text-green-400 font-mono">{model.key}</div>
              <label className="text-xs">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="p-2 rounded-md border border-gray-800 bg-black bg-opacity-40 text-white" />
              <label className="text-xs">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 rounded-md border border-gray-800 bg-black bg-opacity-40 text-white" />
              <label className="text-xs">Price</label>
              <input value={price as any} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} type="number" className="p-2 rounded-md border border-gray-800 bg-black bg-opacity-40 text-white" />
              <div className="flex gap-2 mt-2">
                <button onClick={async () => { /* ...existing code... */ }} className="btn-glass text-green-400">[ Save ]</button>
                <button onClick={async () => { /* ...existing code... */ }} className="btn-glass text-pink-400">[ Remove from trading ]</button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="text-green-400 font-mono">{model.key}</h4>
              <a href={model.url} download={model.key.split("/").pop()} className="btn-glass text-green-400">[ Download ]</a>
              <button className="btn-glass text-green-400" onClick={() => router.push(`/lobby/addObjectTrade?s3Key=${encodeURIComponent(model.key)}`)}>[ Trade ]</button>
            </>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={async () => { /* ...existing code... */ }} className="btn-glass text-green-400">[ Delete model ]</button>
        </div>
      </div>

      <h3
        className="absolute bottom-5 text-white text-sm left-1/2 transform -translate-x-1/2"
      >
        Press ESC to exit...
      </h3>
    </div>
  );
}
