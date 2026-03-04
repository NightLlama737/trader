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
    <div className="max-w-[600px] mx-auto my-5 p-5 rounded-xl bg-black bg-opacity-60 text-green-400 flex flex-col gap-4 glass-morph">
      <h2 className="text-center text-xl font-bold">Add New Model</h2>

      <input
        type="file"
        accept=".glb,.gltf,.obj,.fbx"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleFileClick}
        className="btn-glass text-green-400"
      >
        {file ? `[ Selected: ${file.name} ]` : "[ Browse File ]"}
      </button>

      <button
        onClick={addObject}
        disabled={!file || uploading}
        className="btn-glass text-green-400"
      >
        {uploading ? "[ Uploading... ]" : "[ Upload ]"}
      </button>
    </div>
  );
}
