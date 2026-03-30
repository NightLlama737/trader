"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddRenderedImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError(null);
    setProgress(0);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
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
          contentType: file.type,
          prefix: "renders",
        }),
      });

      if (!urlRes.ok) {
        const data = await urlRes.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { uploadUrl, key } = await urlRes.json();

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
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      const saveRes = await fetch("/api/addRenderedImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          title: title.trim() || null,
          contentType: file.type,
        }),
      });

      if (!saveRes.ok) {
        const data = await saveRes.json();
        throw new Error(data.error || "Failed to save image");
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

  const LABEL: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.68rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(245,240,232,0.35)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    width: "100%",
  };

  const INPUT: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "1rem",
    fontWeight: 300,
    background: "transparent",
    color: "#f5f0e8",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    padding: "8px 0",
    outline: "none",
    caretColor: "#f5f0e8",
    width: "100%",
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 24,
      width: 400,
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
        Upload Render
      </h2>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <img
            src={preview}
            alt="Preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0,
            transition: "opacity 0.2s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
          >
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.8rem",
              color: "#fff",
              letterSpacing: "0.1em",
            }}>
              Change image
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn-ghost"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            width: "100%",
            padding: "11px 16px",
            height: 80,
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Image
        </button>
      )}

      <label style={LABEL}>
        Title (optional)
        <input
          style={INPUT}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Final render v2"
        />
      </label>

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
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{ width: "100%" }}
      >
        {uploading ? (progress < 100 ? `Uploading ${progress}%` : "Saving…") : "Upload Render"}
      </button>
    </div>
  );
}