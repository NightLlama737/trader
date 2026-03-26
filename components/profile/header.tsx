"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import SearchBar from "../searchBar";
import NotificationBell from "../notificationBell";

export default function Header({ nickname }: { nickname?: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    document.cookie = "user=; max-age=0; path=/";
    router.push("/");
  };

  const NAV_LABEL: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.65rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgb(212,175,55)",
    padding: "10px 20px 6px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };

  const MENU_ITEM: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "10px 20px",
    background: "transparent",
    border: "none",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.95rem",
    color: "rgba(245,240,232,0.55)",
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "color 0.2s",
    textAlign: "left",
  };

  return (
    <>
      {/* Nav buttons */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px" }}>
        <button className="btn-ghost" onClick={() => router.push("/dashboard")}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1rem", letterSpacing: "0.16em", textTransform: "uppercase",
            color: "rgba(245,240,232,0.6)", marginBottom: 16,
          }}>Trading</h1>
        </button>
        <button className="btn-ghost" onClick={() => router.push("/lobby")}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1rem", letterSpacing: "0.16em", textTransform: "uppercase",
            color: "rgba(245,240,232,0.6)", marginBottom: 16,
          }}>My models</h1>
        </button>
      </div>

      <SearchBar />

      {nickname && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NotificationBell />

          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: "2px",
                border: "1px solid rgba(245,240,232,0.15)",
                background: "transparent",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "0.9rem",
                color: "rgba(245,240,232,0.6)",
                letterSpacing: "0.05em",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f5f0e8"; e.currentTarget.style.borderColor = "rgb(212,175,55)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.6)"; e.currentTarget.style.borderColor = "rgba(245,240,232,0.15)"; }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                border: "1px solid rgb(212,175,55)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", color: "rgba(245,240,232,0.5)",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}>
                {nickname[0].toUpperCase()}
              </div>
              {nickname}
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"
                style={{ transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                <path d="M1 3l4 4 4-4" stroke="rgba(245,240,232,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)",
                minWidth: 180, background: "#0f0f0f",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px",
                overflow: "hidden", zIndex: 999,
                boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              }}>
                <div style={NAV_LABEL}>Account</div>

                <button style={MENU_ITEM}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#f5f0e8"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(245,240,232,0.55)"}
                  onClick={() => { router.push(`/profile/${nickname}`); setMenuOpen(false); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  Profile
                </button>

                <button style={MENU_ITEM}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#f5f0e8"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(245,240,232,0.55)"}
                  onClick={() => { router.push("/settings"); setMenuOpen(false); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  Settings
                </button>

                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />

                <button style={{ ...MENU_ITEM, color: "rgba(210,90,90,0.7)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff9090"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(210,90,90,0.7)"}
                  onClick={handleLogout}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}