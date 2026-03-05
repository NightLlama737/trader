// ═══════════════════════════════════════════════
// addObject.tsx
// ═══════════════════════════════════════════════
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AddObject() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleFileClick = () => fileInputRef.current?.click();

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
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const btnStyle: React.CSSProperties = {
    background: "#1a1a1a",
    color: "#fff",
    fontFamily: "monospace",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background 0.2s",
    width: "100%",
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "20px auto",
        padding: 20,
        borderRadius: 12,
        backgroundColor: "#1a1a1a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "monospace",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#fff", margin: 0 }}>Add New Model</h2>

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
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
      >
        {file ? `[ Selected: ${file.name} ]` : "[ Browse File ]"}
      </button>

      <button
        onClick={addObject}
        disabled={!file || uploading}
        style={{ ...btnStyle, opacity: !file || uploading ? 0.4 : 1, cursor: !file || uploading ? "not-allowed" : "pointer" }}
        onMouseEnter={(e) => { if (file && !uploading) e.currentTarget.style.background = "#2a2a2a"; }}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
      >
        {uploading ? "[ Uploading... ]" : "[ Upload ]"}
      </button>
    </div>
  );
}


// ═══════════════════════════════════════════════
// addObjectButton.tsx
// ═══════════════════════════════════════════════
// "use client";
// import { useRouter } from "next/navigation";
//
// export default function AddObjectButton() {
//   const router = useRouter();
//   return (
//     <button
//       style={{
//         position: "fixed",
//         left: "45%",
//         bottom: 20,
//         width: "12%",
//         background: "#1a1a1a",
//         color: "#fff",
//         fontFamily: "monospace",
//         padding: "10px",
//         borderRadius: "5px",
//         cursor: "pointer",
//       }}
//       onClick={() => router.push("/lobby/addObject")}
//     >
//       [ Add model ]
//     </button>
//   );
// }
