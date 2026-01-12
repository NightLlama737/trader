"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Next.js 16 hook
import * as THREE from "three";

function Scene() {
  const { scene } = useGLTF("/computer.glb");
  const { set } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [animating, setAnimating] = useState(false);
  const [targetPos] = useState(new THREE.Vector3(0, 0.5, 1.5));

  const router = useRouter(); // ✅ correct client-side router

  useEffect(() => {
    const cam = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    cam.position.set(0, 2, 10);
    cam.lookAt(0, 0, 0);
    cameraRef.current = cam;
    set({ camera: cam });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") setAnimating(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [set]);

  useFrame(() => {
    if (animating && cameraRef.current) {
      // lineární interpolace pozice
      cameraRef.current.position.lerp(targetPos, 0.05);

      // po dokončení animace
      if (cameraRef.current.position.distanceTo(targetPos) < 0.01) {
        cameraRef.current.position.copy(targetPos);
        cameraRef.current.lookAt(targetPos.x, targetPos.y, targetPos.z + 9);
        setAnimating(false);

        // ✅ navigate safely on client
        if (typeof window !== "undefined") {
          router.push("/authPage");
        }
      }
    }
  });

  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export default function HomePageThree() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Canvas style={{ width: "100%", height: "100%" }} gl={{ alpha: false }}>
        <color attach="background" args={["black"]} />
        <Scene />
        <OrbitControls enablePan={false} enableZoom enableRotate />
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <Environment preset="sunset" background={false} />
      </Canvas>
    </div>
  );
}
