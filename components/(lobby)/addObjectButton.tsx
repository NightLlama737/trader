"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddObjectButton() {
  const router = useRouter();
  return (
    <button
      style={{
        position: "fixed",
        display: "flex",
        bottom: "20px",
        left: "50%",
        width: "100px",
        backgroundColor: "transparent",
        height: "100px",
        alignItems: "center",
        justifyContent: "center",
        transform: "translateX(-50%)",
        padding: "10px 20px",
        color: "aqua",
        fontSize: "100px",
        marginBottom: "40px",
        border: "none",
        cursor: "pointer",
      }}
      onClick={() => router.push("/lobby/addObject")}
    >
      +
    </button>
  );
}
