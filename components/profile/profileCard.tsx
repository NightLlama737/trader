"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  nickname: string;
  email: string;
};

type OffModel = {
  id: string;
  key: string;
  name: string;
  description: string;
  price: number;
  url: string;
  userId: string;
  category?: { id: string; name: string } | null;
};

export default function ProfileCard({ nickname }: { nickname: string }) {
  const router = useRouter();

  const [user, setUser]               = useState<User | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [models, setModels]           = useState<OffModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  /* ── Fetch user ── */
  useEffect(() => {
    if (!nickname) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/findUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrNick: decodeURIComponent(nickname) }),
        });
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        if (data.success) setUser(data.user);
        else setNotFound(true);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    };
    load();
  }, [nickname]);

  /* ── Fetch this user's listed models ── */
  useEffect(() => {
    if (!user) return;
    setModelsLoading(true);
    fetch("/api/getOffModels")
      .then((r) => r.json())
      .then((d) => {
        const all: OffModel[] = d.models || [];
        setModels(all.filter((m) => m.userId === user.id));
      })
      .catch(console.error)
      .finally(() => setModelsLoading(false));
  }, [user]);

  const handleFriendRequest = () => {
    // TODO: implement friend request
    console.log("Send friend request to", user?.id);
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={S.center}><div style={S.spinner} /></div>
  );

  /* ── Not found ── */
  if (notFound) return (
    <div style={S.center}>
      <div style={S.card}>
        <span style={{ ...S.avatar, fontSize: "1.6rem", width: 64, height: 64 }}>?</span>
        <p style={S.notFoundTitle}>User not found</p>
        <p style={S.notFoundSub}>
          No account with nickname&nbsp;
          <code style={S.code}>{nickname}</code>&nbsp;exists.
        </p>
        <button style={S.backBtn} onClick={() => router.back()}>← Go back</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>

      {/* ── Left sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.avatar}>{user!.nickname[0].toUpperCase()}</div>
        <h1 style={S.name}>{user!.nickname}</h1>
        <p style={S.uid}><code style={S.code}>{user!.id}</code></p>

        <div style={S.table}>
          <Row label="nickname" value={user!.nickname} />
          <Row label="email"    value={user!.email} />
        </div>

        <div style={S.actions}>
          <ActionBtn
            onClick={handleFriendRequest}
            label="+ Send Friend Request"
          />
          <ActionBtn
            onClick={() => router.push(`/profile/${encodeURIComponent(nickname)}/sendModel`)}
            label="↗ Send Model"
          />
          <button style={S.backBtn} onClick={() => router.back()}>
            ← Back
          </button>
        </div>
      </aside>

      {/* ── Right: listed models ── */}
      <main style={S.main}>
        <h2 style={S.sectionTitle}>
          Listed Models
          <span style={S.count}>({models.length})</span>
        </h2>

        {modelsLoading ? (
          <p style={S.muted}>Loading…</p>
        ) : models.length === 0 ? (
          <p style={S.muted}>No models listed for trading.</p>
        ) : (
          <div style={S.grid}>
            {models.map((m) => (
              <ModelCard key={m.key} model={m} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Action button helper ── */
function ActionBtn({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        width: "100%",
        background: "transparent",
        border: `1px solid ${hovered ? "rgb(212,175,55)" : "rgba(245,240,232,0.18)"}`,
        borderRadius: 2,
        color: hovered ? "#fff" : "rgba(245,240,232,0.65)",
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: "0.9rem",
        letterSpacing: "0.06em",
        padding: "9px 18px",
        cursor: "pointer",
        transition: "all 0.2s",
        textAlign: "center",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  );
}

/* ── Model card (static preview) ── */
function ModelCard({ model }: { model: OffModel }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        borderRadius: 2,
        overflow: "hidden",
        background: "#111",
        border: `1px solid ${hovered ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.06)"}`,
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: "100%", height: 130,
        background: "#0e0e0e",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "2rem", color: "rgba(255,255,255,0.07)" }}>◈</span>
      </div>
      <div style={{
        padding: "11px 13px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.92rem", color: "#f5f0e8",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{model.name}</p>
        <p style={{
          margin: 0,
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.76rem", color: "rgba(245,240,232,0.28)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{model.description}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "rgba(245,240,232,0.5)" }}>
            {model.price} €
          </span>
          {model.category && (
            <span style={{
              fontFamily: "monospace", fontSize: "0.58rem",
              color: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 2, padding: "1px 6px", letterSpacing: "0.04em",
            }}>
              {model.category.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Row helper ── */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 16,
    }}>
      <span style={{
        fontFamily: "monospace", fontSize: "0.67rem",
        color: "rgba(255,255,255,0.2)", textTransform: "uppercase",
        letterSpacing: "0.08em", flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontFamily: "monospace", fontSize: "0.78rem",
        color: "rgba(255,255,255,0.48)", wordBreak: "break-all", textAlign: "right",
      }}>{value}</span>
    </div>
  );
}

/* ─────────────── Styles ─────────────── */
const S: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0a0a0a",
    paddingTop: 90,
  },
  sidebar: {
    width: 290,
    minWidth: 290,
    position: "sticky",
    top: 90,
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "40px 24px",
    borderRight: "1px solid rgba(255,255,255,0.05)",
  },
  main: {
    flex: 1,
    padding: "40px 48px",
  },
  center: {
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "#0a0a0a", padding: 24,
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "40px 36px", width: "100%", maxWidth: 420,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
  },
  avatar: {
    width: 72, height: 72, borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(212,175,55,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.8rem", color: "rgba(245,240,232,0.55)",
    fontFamily: "'Playfair Display', Georgia, serif",
    marginBottom: 4,
  },
  name: {
    margin: 0,
    color: "#f5f0e8",
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.2rem", fontWeight: 400,
    letterSpacing: "0.03em", textAlign: "center",
  },
  uid: { margin: 0, marginBottom: 4 },
  code: {
    fontFamily: "monospace", fontSize: "0.68rem",
    color: "rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.03)",
    padding: "2px 6px", borderRadius: 4,
  },
  table: {
    width: "100%",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    marginTop: 4, marginBottom: 8,
  },
  actions: {
    display: "flex", flexDirection: "column", gap: 7, width: "100%", marginTop: 4,
  },
  backBtn: {
    width: "100%", marginTop: 2,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 2,
    color: "rgba(255,255,255,0.25)",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.8rem", padding: "7px 18px",
    cursor: "pointer", transition: "all 0.15s", textAlign: "center",
  },
  notFoundTitle: {
    margin: 0, color: "rgba(255,255,255,0.6)",
    fontFamily: "monospace", fontSize: "1rem",
  },
  notFoundSub: {
    margin: 0, color: "rgba(255,255,255,0.3)",
    fontFamily: "monospace", fontSize: "0.78rem", textAlign: "center",
  },
  spinner: {
    width: 28, height: 28, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.06)",
    borderTop: "2px solid rgba(255,255,255,0.3)",
    animation: "spin 0.7s linear infinite",
  },
  sectionTitle: {
    margin: "0 0 24px", color: "#f5f0e8",
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.1rem", fontWeight: 400, letterSpacing: "0.04em",
  },
  count: {
    color: "rgba(255,255,255,0.22)", marginLeft: 8,
    fontSize: "0.82rem", fontFamily: "monospace",
  },
  muted: {
    color: "rgba(255,255,255,0.2)",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontStyle: "italic", fontSize: "0.95rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
    gap: 14,
  },
};