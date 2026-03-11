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

type RenderedImage = {
  id: string;
  key: string;
  title: string | null;
  url: string;
  createdAt: string;
};

type Tab = "models" | "renders";

export default function ProfileCard({ nickname }: { nickname: string }) {
  const router = useRouter();

  const [user, setUser]                   = useState<User | null>(null);
  const [loading, setLoading]             = useState(true);
  const [notFound, setNotFound]           = useState(false);
  const [models, setModels]               = useState<OffModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [renders, setRenders]             = useState<RenderedImage[]>([]);
  const [rendersLoading, setRendersLoading] = useState(false);
  const [activeTab, setActiveTab]         = useState<Tab>("models");

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

  /* ── Fetch listed models ── */
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

  /* ── Fetch renders ── */
  useEffect(() => {
    if (!user) return;
    setRendersLoading(true);
    fetch(`/api/getRenderedImages?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => setRenders(d.images || []))
      .catch(console.error)
      .finally(() => setRendersLoading(false));
  }, [user]);

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

        <div style={S.actions}>
          <ActionBtn
            onClick={() => console.log("Send friend request to", user?.id)}
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

      {/* ── Right: tabs + content ── */}
      <main style={S.main}>

        {/* Tab bar */}
        <div style={S.tabBar}>
          <TabButton
            label="Listed Models"
            count={models.length}
            active={activeTab === "models"}
            onClick={() => setActiveTab("models")}
          />
          <TabButton
            label="Renders"
            count={renders.length}
            active={activeTab === "renders"}
            onClick={() => setActiveTab("renders")}
          />
        </div>

        {/* ── Models tab ── */}
        {activeTab === "models" && (
          <>
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
          </>
        )}

        {/* ── Renders tab ── */}
        {activeTab === "renders" && (
          <>
            {rendersLoading ? (
              <p style={S.muted}>Loading…</p>
            ) : renders.length === 0 ? (
              <p style={S.muted}>No renders uploaded yet.</p>
            ) : (
              <div style={S.renderGrid}>
                {renders.map((img) => (
                  <RenderCard key={img.id} image={img} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ── Tab button ── */
function TabButton({
  label, count, active, onClick,
}: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: "0.9rem",
        letterSpacing: "0.06em",
        color: active ? "#fff" : "rgba(245,240,232,0.35)",
        background: "transparent",
        border: "none",
        borderBottom: active ? "1px solid rgb(212,175,55)" : "1px solid transparent",
        padding: "8px 4px",
        marginRight: 32,
        cursor: "pointer",
        transition: "all 0.2s",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {label}
      <span style={{
        fontSize: "0.68rem",
        color: active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 10,
        padding: "1px 7px",
      }}>
        {count}
      </span>
    </button>
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

/* ── Model card ── */
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
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.8rem", color: "rgba(245,240,232,0.5)" }}>
            {model.price} €
          </span>
          {model.category && (
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.58rem",
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

/* ── Render card ── */
function RenderCard({ image }: { image: RenderedImage }) {
  const [hovered, setHovered] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <div
        onClick={() => setLightbox(true)}
        style={{
          borderRadius: 2,
          overflow: "hidden",
          background: "#111",
          border: `1px solid ${hovered ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.06)"}`,
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ width: "100%", height: 180, overflow: "hidden", position: "relative" }}>
          <img
            src={image.url}
            alt={image.title || "Render"}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        </div>
        {image.title && (
          <div style={{
            padding: "9px 12px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}>
            <p style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.82rem", color: "rgba(245,240,232,0.5)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {image.title}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.88)",
            zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={image.url}
            alt={image.title || "Render"}
            style={{
              maxWidth: "90vw",
              maxHeight: "88vh",
              objectFit: "contain",
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          {image.title && (
            <div style={{
              position: "absolute",
              bottom: 24,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.06em",
            }}>
              {image.title}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ─────────────── Styles ─────────────── */
const S: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
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
  tabBar: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 32,
    paddingBottom: 0,
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
  },
  avatar: {
    width: 72, height: 72, borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(212,175,55,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.8rem", color: "rgba(245,240,232,0.55)",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    marginBottom: 4,
  },
  name: {
    margin: 0,
    color: "#f5f0e8",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "1.2rem", fontWeight: 400,
    letterSpacing: "0.03em", textAlign: "center",
  },
  code: {
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.68rem",
    color: "rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.03)",
    padding: "2px 6px", borderRadius: 4,
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
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem",
  },
  notFoundSub: {
    margin: 0, color: "rgba(255,255,255,0.3)",
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.78rem", textAlign: "center",
  },
  spinner: {
    width: 28, height: 28, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.06)",
    borderTop: "2px solid rgba(255,255,255,0.3)",
    animation: "spin 0.7s linear infinite",
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
  renderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 14,
  },
};