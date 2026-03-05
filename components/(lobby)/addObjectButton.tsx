"use client";
import { useRouter } from "next/navigation";

export default function AddObjectButton() {
  const router = useRouter();
  return (
    <button
      style={{
        position: "fixed",
        left: "45%",
        bottom: 20,
        width: "12%",
        background: "#1a1a1a",
        color: "#fff",
        fontFamily: "monospace",
        padding: "10px",
        borderRadius: "5px",
        cursor: "pointer",
      }}
      onClick={() => router.push("/lobby/addObject")}
    >
      [ Add model ]
    </button>
  );
}