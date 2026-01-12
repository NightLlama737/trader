"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";

function Scene() {
  const { scene } = useGLTF("/computer.glb");
  const { set } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [animating, setAnimating] = useState(false);

  const router = useRouter();

  const targetPos = new THREE.Vector3(0, 1.5, 2.2);
  const startPos = new THREE.Vector3(0, 1, 10);

  useEffect(() => {
    const cam = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    cam.position.copy(startPos);
    cam.lookAt(startPos.x, startPos.y, startPos.z - 10);
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
      cameraRef.current.position.lerp(targetPos, 0.05);

      if (cameraRef.current.position.distanceTo(targetPos) < 0.01) {
        cameraRef.current.position.copy(targetPos);
        // kamera kouká rovně po ose X
        cameraRef.current.lookAt(
          cameraRef.current.position.x + 10,
          cameraRef.current.position.y,
          cameraRef.current.position.z
        );
        setAnimating(false);

        if (typeof window !== "undefined") router.push("/authPage");
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
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <Environment preset="sunset" background={false} />
      </Canvas>
    </div>
  );
}
