"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddObject() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const addObject = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/addObject", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }

      // ✅ redirect s S3 KEY
      router.push(`/lobby`);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid aqua",
        borderRadius: "5px",
        backgroundColor: "#222",
        color: "white",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Add New Model</h2>

      <input
        type="file"
        accept=".glb,.gltf,.obj,.fbx"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <button
        type="button"
        onClick={handleFileClick}
        style={{
          padding: "10px",
          borderRadius: "5px",
          border: "1px solid aqua",
          backgroundColor: "#444",
          color: "white",
          cursor: "pointer",
        }}
      >
        {file ? `Selected: ${file.name}` : "Browse File"}
      </button>

      <button
        onClick={addObject}
        disabled={!file || uploading}
        style={{
          padding: "10px",
          borderRadius: "5px",
          border: "1px solid aqua",
          backgroundColor: uploading ? "#555" : "#444",
          color: "white",
          cursor: !file || uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
