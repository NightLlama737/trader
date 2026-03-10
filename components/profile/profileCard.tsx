"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type User = {
  id: string;
  nickname: string;
  email: string;
};

export default function ProfileCard({ nickname }: { nickname: string }) {
  const router = useRouter();

  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!nickname) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/findUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrNick: decodeURIComponent(nickname as string) }),
        });

        if (res.status === 404) {
          setNotFound(true);
          return;
        }

        const data = await res.json();
        if (data.success) setUser(data.user);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [nickname]);

  /* ── Loading ── */
  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
    </div>
  );

  /* ── Not found ── */
  if (notFound) return (
    <div style={styles.center}>
      <div style={styles.card}>
        <span style={{ ...styles.avatar, fontSize: "1.6rem" }}>?</span>
        <p style={styles.notFoundTitle}>User not found</p>
        <p style={styles.notFoundSub}>
          No account with the nickname&nbsp;
          <code style={styles.code}>{nickname}</code>&nbsp;exists.
        </p>
        <button style={styles.backBtn} onClick={() => router.back()}>
          ← Go back
        </button>
      </div>
    </div>
  );

  /* ── Profile ── */
  return (
    <div style={styles.center}>
      <div style={styles.card}>
        {/* Avatar */}
        <div style={styles.avatar}>
          {user!.nickname[0].toUpperCase()}
        </div>

        {/* Name + ID */}
        <h1 style={styles.name}>{user!.nickname}</h1>
        <p style={styles.uid}>
          <code style={styles.code}>{user!.id}</code>
        </p>

        {/* Details */}
        <div style={styles.table}>
          <Row label="nickname" value={user!.nickname} />
          <Row label="email"    value={user!.email}    />
        </div>

        <button style={styles.backBtn} onClick={() => router.back()}>
          ← Back
        </button>
      </div>
    </div>
  );
}

/* ── Row helper ── */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={rowStyles.wrap}>
      <span style={rowStyles.label}>{label}</span>
      <span style={rowStyles.value}>{value}</span>
    </div>
  );
}

/* ── Styles ── */
const styles: Record<string, React.CSSProperties> = {
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
    padding: 24,
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.8rem",
    color: "rgba(255,255,255,0.5)",
    fontFamily: "monospace",
    marginBottom: 6,
  },
  name: {
    margin: 0,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "monospace",
    fontSize: "1.3rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  uid: {
    margin: 0,
    marginBottom: 8,
  },
  code: {
    fontFamily: "monospace",
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.04)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  table: {
    width: "100%",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    marginTop: 8,
  },
  notFoundTitle: {
    margin: 0,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "monospace",
    fontSize: "1rem",
  },
  notFoundSub: {
    margin: 0,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "monospace",
    fontSize: "0.78rem",
    textAlign: "center",
  },
  backBtn: {
    marginTop: 12,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "monospace",
    fontSize: "0.78rem",
    padding: "7px 18px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.06)",
    borderTop: "2px solid rgba(255,255,255,0.3)",
    animation: "spin 0.7s linear infinite",
  },
};

const rowStyles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    gap: 16,
  },
  label: {
    fontFamily: "monospace",
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    flexShrink: 0,
  },
  value: {
    fontFamily: "monospace",
    fontSize: "0.82rem",
    color: "rgba(255,255,255,0.55)",
    wordBreak: "break-all",
    textAlign: "right",
  },
};