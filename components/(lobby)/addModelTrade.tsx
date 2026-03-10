"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Category = { id: string; name: string };

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

export default function AddModelTrade() {
  const searchParams = useSearchParams();
  const s3Key = searchParams.get("s3Key");
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/getCategories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(categoryInput.toLowerCase()));

  const handleSubmit = async () => {
    if (!s3Key) return alert("Missing S3 key!");
    try {
      const res = await fetch("/api/offModelTrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key, name, description, price, categoryName: categoryInput.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) router.push("/lobby");
      else alert("Error: " + data.error);
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 22,
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
        marginBottom: 4,
      }}>
        List for Trading
      </h2>

      <label style={LABEL}>
        Name
        <input style={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label style={LABEL}>
        Description
        <input style={INPUT} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label style={LABEL}>
        Price (€)
        <input type="number" style={INPUT} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
      </label>

      <label style={{ ...LABEL, position: "relative" }}>
        Category
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <input
            style={INPUT}
            value={categoryInput}
            onChange={(e) => { setCategoryInput(e.target.value); setDropdownOpen(true); }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Type or select…"
          />
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0, right: 0,
              background: "#181818",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 2,
              zIndex: 100,
              maxHeight: 160,
              overflowY: "auto",
            }}>
              {categoryInput.trim() !== "" && filtered.length === 0 && (
                <div
                  style={{
                    padding: "10px 14px",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.95rem",
                    color: "rgba(245,240,232,0.55)",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                  onClick={() => setDropdownOpen(false)}
                >
                  Create "{categoryInput.trim()}"
                </div>
              )}
              {filtered.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "10px 14px",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.95rem",
                    color: "rgba(245,240,232,0.45)",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f5f0e8")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.45)")}
                  onClick={() => { setCategoryInput(c.name); setDropdownOpen(false); }}
                >
                  {c.name}
                </div>
              ))}
              {categories.length === 0 && (
                <div style={{
                  padding: "10px 14px",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "0.85rem",
                  color: "rgba(245,240,232,0.18)",
                  fontStyle: "italic",
                }}>
                  No categories yet
                </div>
              )}
            </div>
          )}
        </div>
      </label>

      <button className="btn-primary" style={{ width: "100%", marginTop: 10 }} onClick={handleSubmit}>
        List Model
      </button>
    </div>
  );
}