"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddObject() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setProgress(0);
    setFile(e.target.files?.[0] || null);
  };

  const addObject = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const urlRes = await fetch("/api/getUploadUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "model/gltf-binary",
        }),
      });

      if (!urlRes.ok) {
        const data = await urlRes.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { uploadUrl, key } = await urlRes.json();

      if (!key) throw new Error("Server did not return a key");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "model/gltf-binary");
        xhr.send(file);
      });

      const saveRes = await fetch("/api/addObject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (!saveRes.ok) {
        const data = await saveRes.json();
        throw new Error(data.error || "Failed to save model");
      }

      router.push("/lobby");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      setProgress(0);
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

      {file && (
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.3)",
          margin: 0,
        }}>
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      )}

      {uploading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{
            width: "100%",
            height: 2,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 1,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "rgb(212,175,55)",
              transition: "width 0.2s ease",
              borderRadius: 1,
            }} />
          </div>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.75rem",
            color: "rgba(212,175,55,0.7)",
            margin: 0,
            textAlign: "right",
          }}>
            {progress < 100 ? `Uploading… ${progress}%` : "Saving…"}
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(210,90,90,0.07)",
          border: "1px solid rgba(210,90,90,0.3)",
          borderRadius: 2,
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.82rem",
          color: "rgba(210,90,90,0.9)",
        }}>
          {error}
        </div>
      )}

      <button
        className="btn-primary"
        onClick={addObject}
        disabled={!file || uploading}
        style={{ width: "100%" }}
      >
        {uploading ? (progress < 100 ? `Uploading ${progress}%` : "Saving…") : "Upload"}
      </button>
    </div>
  );
}