"use client";
import { useRouter } from "next/navigation";

export default function AddObjectButton() {
  const router = useRouter();
  return (
    <button
      className="btn-primary"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 36,
        zIndex: 10,
        minWidth: 160,
      }}
      onClick={() => router.push("/lobby/addObject")}
    >
      Add Model
    </button>
  );
}