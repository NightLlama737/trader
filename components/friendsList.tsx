"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Friend = { id: string; nickname: string; friendshipId: string };

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => setFriends(d.friends || []))
      .catch(() => {});
  }, []);

  if (friends.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "4px 0",
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.62rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)",
        }}>
          Friends ({friends.length})
        </span>
        <svg
          width="8" height="8" viewBox="0 0 10 10" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <path d="M1 3l4 4 4-4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {friends.map((f) => (
            <button
              key={f.id}
              onClick={() => router.push(`/profile/${f.nickname}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                background: "transparent",
                border: "none",
                borderRadius: 2,
                cursor: "pointer",
                transition: "background 0.15s",
                textAlign: "left",
                width: "100%",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: "1px solid rgba(212,175,55,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                color: "rgba(212,175,55,0.7)",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                flexShrink: 0,
              }}>
                {f.nickname[0].toUpperCase()}
              </div>
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "0.82rem",
                color: "rgba(245,240,232,0.45)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {f.nickname}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}