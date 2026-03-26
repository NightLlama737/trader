"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import FriendsList from "../friendsList";

type User = { id: string; nickname: string; email: string };
type OffModel = {
  id: string; key: string; name: string; description: string;
  price: number; url: string; userId: string; category?: { id: string; name: string } | null;
};
type RenderedImage = { id: string; key: string; title: string | null; url: string; createdAt: string };
type Tab = "models" | "renders";
type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

export default function ProfileCard({ nickname }: { nickname: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [models, setModels] = useState<OffModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [renders, setRenders] = useState<RenderedImage[]>([]);
  const [rendersLoading, setRendersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("models");
  const [myId, setMyId] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);

  // Three.js refs for model cards
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/getUserId")
      .then((r) => r.json())
      .then((d) => setMyId(d.userId))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!nickname) return;
    setLoading(true);
    fetch("/api/findUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrNick: decodeURIComponent(nickname) }),
    })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        if (data.success) setUser(data.user);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [nickname]);

  useEffect(() => {
    if (!user || !myId || user.id === myId) return;
    fetch(`/api/friends?checkId=${user.id}`)
      .then((r) => r.json())
      .then((d: { status?: string; direction?: string; id?: string }) => {
        if (!d.status || d.status === "none") {
          setFriendStatus("none");
          setFriendshipId(null);
        } else if (d.status === "ACCEPTED") {
          setFriendStatus("accepted");
          setFriendshipId(d.id ?? null);
        } else if (d.status === "PENDING") {
          setFriendStatus(d.direction === "sent" ? "pending_sent" : "pending_received");
          setFriendshipId(d.id ?? null);
        }
      })
      .catch(() => {});
  }, [user, myId]);

  useEffect(() => {
    if (!user) return;
    setModelsLoading(true);
    fetch("/api/getOffModels")
      .then((r) => r.json())
      .then((d) => {
        const filtered: OffModel[] = (d.models || []).filter((m: OffModel) => m.userId === user.id);
        setModels(filtered);
        const init: Record<string, boolean> = {};
        filtered.forEach((m) => { init[m.key] = true; });
        setLoadingModels(init);
      })
      .catch(console.error)
      .finally(() => setModelsLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setRendersLoading(true);
    fetch(`/api/getRenderedImage?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => setRenders(d.images || []))
      .catch(console.error)
      .finally(() => setRendersLoading(false));
  }, [user]);

  // Three.js rendering for model cards (same as OffModels)
  useEffect(() => {
    if (activeTab !== "models" || !models.length) return;

    const loader = new GLTFLoader();
    const renderers: THREE.WebGLRenderer[] = [];

    models.forEach((model) => {
      const container = containerRefs.current.get(model.key);
      if (!container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0e0e0e);
      const w = container.clientWidth || 240;
      const h = container.clientHeight || 200;
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      camera.position.z = 5;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      if (!container.contains(renderer.domElement)) container.appendChild(renderer.domElement);
      renderers.push(renderer);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const light = new THREE.DirectionalLight(0xffffff, 8);
      light.position.set(5, 5, 5);
      scene.add(light);

      fetch(`/api/getSignedUrl?key=${encodeURIComponent(model.key)}`)
        .then((r) => r.json())
        .then(({ url }) => {
          loader.load(
            url,
            (gltf) => {
              const obj = gltf.scene;
              scene.add(obj);
              const box = new THREE.Box3().setFromObject(obj);
              obj.position.sub(box.getCenter(new THREE.Vector3()));
              obj.rotation.y = Math.PI * 1.5;
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const fov = camera.fov * (Math.PI / 180);
              const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.8;
              camera.position.set(0, 0, cameraZ);
              camera.near = cameraZ / 100;
              camera.far = cameraZ * 100;
              camera.updateProjectionMatrix();
              renderer.render(scene, camera);
              setLoadingModels((prev) => ({ ...prev, [model.key]: false }));
            },
            undefined,
            () => setLoadingModels((prev) => ({ ...prev, [model.key]: false }))
          );
        })
        .catch(() => setLoadingModels((prev) => ({ ...prev, [model.key]: false })));
    });

    return () => { renderers.forEach((r) => r.dispose()); };
  }, [models, activeTab]);

  const sendFriendRequest = async () => {
    if (!user || friendLoading) return;
    setFriendLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFriendStatus("pending_sent");
        setFriendshipId(data.friend?.id ?? null);
      } else if (res.status === 409) {
        const existing = data.existingStatus as string | undefined;
        if (existing === "ACCEPTED") setFriendStatus("accepted");
        else setFriendStatus("pending_sent");
      }
    } catch {}
    setFriendLoading(false);
  };

  const unfriend = async () => {
    if (!friendshipId || friendLoading) return;
    setFriendLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: friendshipId }),
      });
      if (res.ok) {
        setFriendStatus("none");
        setFriendshipId(null);
      }
    } catch {}
    setFriendLoading(false);
  };

  if (loading) return (
    <div style={S.center}><div style={S.spinner} /></div>
  );

  if (notFound) return (
    <div style={S.center}>
      <div style={S.card}>
        <span style={{ ...S.avatar, fontSize: "1.6rem", width: 64, height: 64 }}>?</span>
        <p style={S.notFoundTitle}>User not found</p>
        <p style={S.notFoundSub}>
          No account with nickname <code style={S.code}>{nickname}</code> exists.
        </p>
        <button style={S.backBtn} onClick={() => router.back()}>← Go back</button>
      </div>
    </div>
  );

  const isOwnProfile = myId && user && myId === user.id;

  const friendBtnLabel = () => {
    if (friendLoading) return "…";
    switch (friendStatus) {
      case "accepted":       return "✓ Friends";
      case "pending_sent":   return "Request Sent";
      case "pending_received": return "Accept Request";
      default:               return "+ Add Friend";
    }
  };

  const friendBtnDisabled = friendLoading || friendStatus === "pending_sent";

  const handleFriendBtn = () => {
    if (friendStatus === "accepted") {
      unfriend();
    } else {
      sendFriendRequest();
    }
  };

  return (
    <div style={S.page}>

      {/* ── Left sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.avatar}>{user!.nickname[0].toUpperCase()}</div>
        <h1 style={S.name}>{user!.nickname}</h1>

        <div style={S.actions}>
          {!isOwnProfile && (
            <>
              <ActionBtn
                onClick={handleFriendBtn}
                label={friendBtnLabel()}
                disabled={friendBtnDisabled}
                danger={friendStatus === "accepted"}
              />
              <ActionBtn
                onClick={() => router.push(`/profile/${encodeURIComponent(nickname)}/sendModel`)}
                label="↗ Send Model"
              />
            </>
          )}
          {isOwnProfile && (
            <>
              <ActionBtn onClick={() => router.push("/settings")} label="⚙ Settings" />
              <FriendsList />
            </>
          )}
          <button style={S.backBtn} onClick={() => router.back()}>← Back</button>
        </div>
      </aside>

      {/* ── Right: tabs + content ── */}
      <main style={S.main}>
        <div style={S.tabBar}>
          <TabButton label="Listed Models" count={models.length} active={activeTab === "models"} onClick={() => setActiveTab("models")} />
          <TabButton label="Renders"       count={renders.length} active={activeTab === "renders"} onClick={() => setActiveTab("renders")} />
        </div>

        {activeTab === "models" && (
          modelsLoading ? <p style={S.muted}>Loading…</p> :
          models.length === 0 ? <p style={S.muted}>No models listed for trading.</p> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
            {models.map((model) => (
              <div
                key={model.key}
                style={{
                  borderRadius: 2, overflow: "hidden", background: "#111",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", flexDirection: "column",
                  transition: "border-color 0.22s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgb(212,175,55)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              >
                {/* Three.js canvas container */}
                <div
                  ref={(el) => { if (el) containerRefs.current.set(model.key, el); }}
                  style={{ width: "100%", height: 200, background: "#0e0e0e", position: "relative" }}
                >
                  {loadingModels[model.key] && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,255,255,0.2)",
                      fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.75rem",
                    }}>
                      Loading…
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "13px 15px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.88rem", color: "#f5f0e8",
                    marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {model.name}
                  </p>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.75rem", color: "rgba(245,240,232,0.3)",
                    marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {model.description}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.88rem", color: "rgba(245,240,232,0.6)" }}>
                      {model.price} €
                    </span>
                    {model.category && (
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: "0.62rem", color: "rgba(255,255,255,0.22)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 2, padding: "2px 7px", letterSpacing: "0.05em",
                      }}>
                        {model.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "renders" && (
          rendersLoading ? <p style={S.muted}>Loading…</p> :
          renders.length === 0 ? <p style={S.muted}>No renders uploaded yet.</p> :
          <div style={S.renderGrid}>{renders.map((img) => <RenderCard key={img.id} image={img} />)}</div>
        )}
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function TabButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.9rem",
      letterSpacing: "0.06em",
      color: active ? "#fff" : "rgba(245,240,232,0.35)",
      background: "transparent", border: "none",
      borderBottom: active ? "1px solid rgb(212,175,55)" : "1px solid transparent",
      padding: "8px 4px", marginRight: 32, cursor: "pointer", transition: "all 0.2s",
      display: "inline-flex", alignItems: "center", gap: 8, marginBottom: -1,
    }}>
      {label}
      <span style={{
        fontSize: "0.68rem",
        color: active ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "1px 7px",
      }}>{count}</span>
    </button>
  );
}

function ActionBtn({ onClick, label, disabled, danger }: { onClick: () => void; label: string; disabled?: boolean; danger?: boolean }) {
  const [hovered, setHovered] = useState(false);

  const borderColor = () => {
    if (disabled) return "rgba(255,255,255,0.08)";
    if (danger && hovered) return "rgba(210,90,90,0.6)";
    if (danger) return "rgba(210,90,90,0.3)";
    if (hovered) return "rgb(212,175,55)";
    return "rgba(245,240,232,0.18)";
  };

  const textColor = () => {
    if (disabled) return "rgba(245,240,232,0.25)";
    if (danger && hovered) return "#ff9090";
    if (danger) return "rgba(210,90,90,0.7)";
    if (hovered) return "#fff";
    return "rgba(245,240,232,0.65)";
  };

  return (
    <button
      style={{
        width: "100%", background: "transparent",
        border: `1px solid ${borderColor()}`,
        borderRadius: 2,
        color: textColor(),
        fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.9rem",
        letterSpacing: "0.06em", padding: "9px 18px",
        cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
        textAlign: "center", opacity: disabled ? 0.7 : 1,
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </button>
  );
}

function RenderCard({ image }: { image: RenderedImage }) {
  const [hovered, setHovered] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  return (
    <>
      <div
        onClick={() => setLightbox(true)}
        style={{ borderRadius: 2, overflow: "hidden", background: "#111", border: `1px solid ${hovered ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", transition: "border-color 0.2s" }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        <div style={{ width: "100%", height: 180, overflow: "hidden" }}>
          <img src={image.url} alt={image.title || "Render"} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        </div>
        {image.title && (
          <div style={{ padding: "9px 12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.82rem", color: "rgba(245,240,232,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{image.title}</p>
          </div>
        )}
      </div>
      {lightbox && (
        <div onClick={() => setLightbox(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={image.url} alt={image.title || "Render"} style={{ maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)" }} onClick={(e) => e.stopPropagation()} />
          {image.title && (
            <div style={{ position: "absolute", bottom: 24, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>{image.title}</div>
          )}
        </div>
      )}
    </>
  );
}

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  page:         { display: "flex", minHeight: "100vh", width: "100%", background: "#0a0a0a", paddingTop: 90 },
  sidebar:      { width: 290, minWidth: 290, position: "sticky", top: 90, alignSelf: "flex-start", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 24px", borderRight: "1px solid rgba(255,255,255,0.05)" },
  main:         { flex: 1, padding: "40px 48px" },
  tabBar:       { display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 32 },
  center:       { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", padding: 24 },
  card:         { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "40px 36px", width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  avatar:       { width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", color: "rgba(245,240,232,0.55)", fontFamily: "'Cormorant Garamond', Georgia, serif", marginBottom: 4 },
  name:         { margin: 0, color: "#f5f0e8", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.2rem", fontWeight: 400, letterSpacing: "0.03em", textAlign: "center" },
  code:         { fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 3 },
  actions:      { display: "flex", flexDirection: "column", gap: 7, width: "100%", marginTop: 4 },
  backBtn:      { width: "100%", marginTop: 2, background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2, color: "rgba(255,255,255,0.25)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.8rem", padding: "7px 18px", cursor: "pointer", textAlign: "center" },
  notFoundTitle:{ margin: 0, color: "rgba(255,255,255,0.6)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1rem" },
  notFoundSub:  { margin: 0, color: "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.78rem", textAlign: "center" },
  spinner:      { width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)", borderTop: "2px solid rgba(255,255,255,0.3)", animation: "spin 0.7s linear infinite" },
  muted:        { color: "rgba(255,255,255,0.2)", fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "0.95rem" },
  renderGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 },
};