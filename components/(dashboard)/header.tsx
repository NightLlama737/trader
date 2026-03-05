"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Logo from "./logo";

export default function Header({ nickname }: { nickname?: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Zavři menu při kliknutí mimo
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    document.cookie = "user=; max-age=0; path=/";
    router.push("/");
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(40px); }
        }
        .user-menu-enter { animation: slideIn 0.25s ease forwards; }
        .user-menu-exit  { animation: slideOut 0.2s ease forwards; }

        .user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid rgba(74, 222, 128, 0.3);
          background: rgba(74, 222, 128, 0.07);
          color: #4ade80;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .user-btn:hover {
          background: rgba(74, 222, 128, 0.14);
          border-color: rgba(74, 222, 128, 0.6);
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 16px;
          background: transparent;
          border: none;
          color: #d1fae5;
          font-size: 0.82rem;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }
        .menu-item:hover { background: rgba(74, 222, 128, 0.1); }
        .menu-item.danger { color: #f87171; }
        .menu-item.danger:hover { background: rgba(248, 113, 113, 0.1); }
      `}</style>

      <div style={{ width: "30%" }} className="flex flex-row items-center">
        {/* Levé tlačítka */}
        <button className="btn-glass text-green-400 ml-[4%] mt-5 w-[12%]" onClick={() => router.push("/lobby")}>Lobby</button>
        <button className="btn-glass text-green-400 ml-[4%] mt-5 w-[12%]" onClick={() => router.push("/settings")}>Setting</button>
        <button className="btn-glass text-green-400 ml-[4%] mt-5 w-[12%]" onClick={() => router.push("/")}>Exit</button>

        {/* Spacer */}

        </div>
        {/* Uživatelské menu vpravo */}
        {nickname && (
          <div style={{ position: "relative", width: "100px",marginRight: "7%" }} ref={menuRef}>
            <button className="user-btn" onClick={() => setMenuOpen((o) => !o)}>
              {/* Avatar kruh */}
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(74,222,128,0.18)",
                border: "1px solid rgba(74,222,128,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", color: "#4ade80", fontWeight: 600,
              }}>
                {nickname[0].toUpperCase()}
              </div>
              {nickname}
              {/* Šipka */}
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path d="M1 3l4 4 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                className="user-menu-enter"
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  minWidth: 180,
                  background: "rgba(10,15,10,0.95)",
                  border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: 10,
                  backdropFilter: "blur(12px)",
                  overflow: "hidden",
                  zIndex: 999,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                <div style={{
                  padding: "10px 16px 8px",
                  borderBottom: "1px solid rgba(74,222,128,0.1)",
                  fontSize: "0.7rem", color: "#4ade8088", letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Účet
                </div>

                <button className="menu-item" onClick={() => { router.push("/profile"); setMenuOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  Profil
                </button>

                <button className="menu-item" onClick={() => { router.push("/settings"); setMenuOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  Nastavení
                </button>

                <div style={{ height: 1, background: "rgba(74,222,128,0.08)", margin: "4px 0" }} />

                <button className="menu-item danger" onClick={handleLogout}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Odhlásit se
                </button>
              </div>
            )}
          </div>
        )}
      
    </>
  );
}