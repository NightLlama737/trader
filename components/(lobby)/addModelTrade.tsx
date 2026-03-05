"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Category = { id: string; name: string };

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
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!s3Key) return alert("Missing S3 key!");

    try {
      const res = await fetch("/api/offModelTrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3Key,
          name,
          description,
          price,
          categoryName: categoryInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/lobby");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const inputStyle: React.CSSProperties = {
    outline: "none",
    color: "lightgray",
    paddingLeft: "10px",
    border: "none",
    width: "70%",
    backgroundColor: "black",
    marginBottom: "10px",
  };

  return (
    <div
      style={{
        color: "white",
        display: "flex",
        alignItems: "center",
        width: "500px",
        flexDirection: "column",
        gap: "10px",
        padding: "20px",
      }}
    >
      <h2>Add Model to Trade</h2>

      <label style={{ width: "100%", }}>
        Name:
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label style={{ width: "100%",}}>
        Description:
        <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <label style={{ width: "100%", color: "green", fontFamily: "monospace" }}>
        Price:
        <input
          style={inputStyle}
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </label>

      {/* Category input with dropdown */}
      <label style={{ width: "100%", position: "relative" }}>
        Category:
        <div ref={dropdownRef} style={{ display: "inline-block", width: "70%", position: "relative" }}>
          <input
            style={{ ...inputStyle, width: "100%", marginBottom: 0 }}
            value={categoryInput}
            onChange={(e) => {
              setCategoryInput(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Type or select…"
          />
          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "#111",
                border: "1px solid #333",
                borderRadius: "6px",
                zIndex: 100,
                maxHeight: "180px",
                overflowY: "auto",
              }}
            >
              {filtered.length === 0 && categoryInput.trim() !== "" && (
                <div
                  style={{
                    padding: "8px 12px",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "13px",
                    borderBottom: "1px solid #222",
                  }}
                  onClick={() => {
                    setDropdownOpen(false);
                  }}
                >
                  ＋ Create &quot;{categoryInput.trim()}&quot;
                </div>
              )}
              {filtered.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: "8px 12px",
                    color: "white",
                    cursor: "pointer",
                    borderBottom: "1px solid #222",

                    fontSize: "13px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "lightgray")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
                  onClick={() => {
                    setCategoryInput(c.name);
                    setDropdownOpen(false);
                  }}
                >
                  {c.name}
                </div>
              ))}
              {categories.length === 0 && (
                <div style={{ padding: "8px 12px", color: "#555", fontFamily: "monospace", fontSize: "12px" }}>
                  No categories yet
                </div>
              )}
            </div>
          )}
        </div>
      </label>

      <button
        style={{
          marginTop: "10px",
          height: "40px",
          borderRadius: "5px",
          color: "green",
          border: "none",
          width: "40%",
          backgroundColor: "black",
          fontFamily: "monospace",
          cursor: "pointer",
          transition: "color 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "lightgreen")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "green")}
        onClick={handleSubmit}
      >
        <h2>[ Submit ]</h2>
      </button>
    </div>
  );
}
