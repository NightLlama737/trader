"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddRenderedImage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
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
    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());

    try {
      const res = await fetch("/api/addRenderedImage", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Upload failed"); return; }
      router.push("/lobby");
    } catch {
      alert("Upload failed");
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

      {/* Preview */}
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

      <button
        className="btn-primary"
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{ width: "100%" }}
      >
        {uploading ? "Uploading…" : "Upload Render"}
      </button>
    </div>
  );
}