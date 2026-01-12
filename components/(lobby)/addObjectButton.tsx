"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddObjectButton() {
  const router = useRouter();
  return (
    <button
      style={{
        position: "fixed",

        left: "45%",
        padding: "0px",
        borderRadius: "5px",
        color: "green",
        border: "none",
        bottom: "20px",

        width: "12%",
        backgroundColor: "black",
        fontFamily: "monospace", // CLI font
        cursor: "pointer", // ukazatel
        transition: "background-color 0.3s", // plynulá změna barvy
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "lightgreen")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "green")}
      onClick={() => router.push("/lobby/addObject")}
    >
      <h1 style={{ margin: 0 }}>[ Trading ]</h1>
    </button>
  );
}
