"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type UserResult = { id: string; nickname: string };

export default function SearchBar() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen]       = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/searchUsers?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.users || []);
      setOpen(true);
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div ref={ref} style={{ position: "relative", width: 220 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users…"
        style={{
          width: "20%",
          top: 25,
          position: "fixed",
          left: "40%", right: "40%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          padding: "6px 12px",
          color: "rgba(255,255,255,0.7)",
          fontFamily: "'Cormorant Garamond', Georgia, serif",   
          fontSize: "0.8rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {open && results.length > 0 && (
        <div style={{
          position: "fixed",
          top: 60,
          left: "40%", right: "40%",
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 9999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>
          {results.map((u) => (
            <div
              key={u.id}
              onClick={() => { router.push(`/profile/${u.nickname}`); setOpen(false); setQuery(""); }}
              style={{
                padding: "9px 14px",
                color: "rgba(255,255,255,0.6)",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "0.82rem",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", color: "rgba(255,255,255,0.4)",
              }}>
                {u.nickname[0].toUpperCase()}
              </div>
              {u.nickname}
            </div>
          ))}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0, right: 0,
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "10px 14px",
          color: "rgba(255,255,255,0.25)",
          fontFamily: "monospace",
          fontSize: "0.78rem",
          zIndex: 9999,
        }}>
          No users found
        </div>
      )}
    </div>
  );
}