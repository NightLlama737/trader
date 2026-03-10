"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddObject() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const addObject = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/addObject", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Upload failed"); return; }
      router.push("/lobby");
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 28,
      width: 380,
      padding: "44px 40px",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 3,
      background: "#111",
    }}>
      <h2 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: 400,
        fontSize: "1.4rem",
        color: "#fff",
        letterSpacing: "0.02em",
      }}>
        Upload Model
      </h2>

      <input
        type="file"
        accept=".glb,.gltf,.obj,.fbx"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <button
        type="button"
        className="btn-ghost"
        style={{ border: "1px solid rgba(255,255,255,0.08)", width: "100%", padding: "11px 16px" }}
        onClick={() => fileInputRef.current?.click()}
      >
        {file ? file.name : "Browse File"}
      </button>

      <button
        className="btn-primary"
        onClick={addObject}
        disabled={!file || uploading}
        style={{ width: "100%" }}
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
}