"use client";

import { useState, useEffect, useRef } from "react";

type Notification = {
  id: string;
  type: "friend_request" | "model_gift" | "purchase_request" | "purchase_update" | "gift_received_confirmation" | "friend_removed";
  data: Record<string, unknown>;
  createdAt: string;
};

const getStr = (obj: unknown, key: string): string => {
  if (obj && typeof obj === "object") {
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === "string" ? val : String(val ?? "");
  }
  return "";
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [giftAccepting, setGiftAccepting] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFriendAction = async (friendId: string, action: "accept" | "decline") => {
    setLoading(true);
    try {
      await fetch("/api/friends/respond", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId, action }),
      });
      await fetchNotifications();
    } catch {}
    setLoading(false);
  };

  const handlePurchaseAction = async (purchaseId: string, action: "accept" | "decline") => {
    setLoading(true);
    try {
      await fetch("/api/purchase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId, action }),
      });
      await fetchNotifications();
    } catch {}
    setLoading(false);
  };

  const handlePurchaseSeenAction = async (id: string) => {
    setLoading(true);
    try {
      await fetch("/api/notifications/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "sale_confirmation", id }),
      });
      await fetchNotifications();
    } catch {}
    setLoading(false);
  };

  // Accept gift: fetch source file from S3, upload under current user's folder, confirm in DB
  const handleAcceptGift = async (giftId: string, modelKey: string) => {
    setGiftAccepting(giftId);
    try {
      // 1. Get a signed URL to read the source file
      const srcRes = await fetch(`/api/getSignedUrl?key=${encodeURIComponent(modelKey)}`);
      const { url: sourceUrl } = await srcRes.json();
      if (!sourceUrl) throw new Error("Could not get source URL");

      // 2. Download the source file
      const fileRes = await fetch(sourceUrl);
      if (!fileRes.ok) throw new Error("Failed to download gift file");
      const blob = await fileRes.blob();
      const contentType = blob.type || "model/gltf-binary";

      // 3. Build destination key under current user's folder
      const myRes = await fetch("/api/getUserId");
      const { userId } = await myRes.json();
      if (!userId) throw new Error("Not authenticated");

      const fileName = modelKey.split("/").pop() || `${crypto.randomUUID()}.glb`;
      const destKey = `models/${userId}/${crypto.randomUUID()}-${fileName}`;

      // 4. Get presigned PUT URL
      const putRes = await fetch("/api/getUploadUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: destKey, contentType }),
      });
      const { uploadUrl } = await putRes.json();
      if (!uploadUrl) throw new Error("Failed to get upload URL");

      // 5. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error("S3 upload failed");

      // 6. Confirm – creates Model record in DB and marks gift seen
      const confirmRes = await fetch("/api/giftModel/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId, destKey }),
      });
      if (!confirmRes.ok) {
        const d = await confirmRes.json();
        throw new Error(d.error || "Confirm failed");
      }

      await fetchNotifications();
    } catch (err) {
      console.error("ACCEPT GIFT ERROR:", err);
    }
    setGiftAccepting(null);
  };

  const handleDismissGift = async (id: string) => {
    await fetch("/api/notifications/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "gift", id }),
    });
    await fetchNotifications();
  };

  const handleDismissFriendRemoved = async (notifId: string) => {
    const rawId = notifId.replace("notif-", "");
    await fetch("/api/notifications/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "friend_removed", id: rawId }),
    });
    await fetchNotifications();
  };

  const count = notifications.length;

  const renderNotification = (n: Notification) => {
    const d = n.data;

    if (n.type === "friend_request") {
      const friendId = n.id.replace("friend-", "");
      return (
        <div key={n.id} style={styles.notifItem}>
          <div style={styles.notifIcon}>👤</div>
          <div style={{ flex: 1 }}>
            <p style={styles.notifText}>
              <span style={styles.notifName}>{getStr(d.requester, "nickname")}</span>{" "}
              sent you a friend request
            </p>
            <div style={styles.notifActions}>
              <button style={styles.btnAccept} disabled={loading} onClick={() => handleFriendAction(friendId, "accept")}>Accept</button>
              <button style={styles.btnDecline} disabled={loading} onClick={() => handleFriendAction(friendId, "decline")}>Decline</button>
            </div>
          </div>
        </div>
      );
    }

    if (n.type === "friend_removed") {
      return (
        <div key={n.id} style={styles.notifItem}>
          <div style={styles.notifIcon}>💔</div>
          <div style={{ flex: 1 }}>
            <p style={styles.notifText}>
              <span style={styles.notifName}>{getStr(d.removedBy, "nickname")}</span>{" "}
              removed you from their friends
            </p>
            <div style={styles.notifActions}>
              <button style={styles.btnDecline} disabled={loading} onClick={() => handleDismissFriendRemoved(n.id)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (n.type === "model_gift") {
      const giftId = n.id.replace("gift-", "");
      const modelKey = getStr(d.model, "key");
      const msg = typeof d.message === "string" ? d.message : undefined;
      const isAccepting = giftAccepting === giftId;

      return (
        <div key={n.id} style={styles.notifItem}>
          <div style={styles.notifIcon}>🎁</div>
          <div style={{ flex: 1 }}>
            <p style={styles.notifText}>
              <span style={styles.notifName}>{getStr(d.sender, "nickname")}</span>{" "}
              sent you a model{msg ? <span style={{ color: "rgba(245,240,232,0.4)", fontStyle: "italic" }}>: "{msg}"</span> : ""}
            </p>
            {isAccepting && (
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  height: 2,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 1,
                  overflow: "hidden",
                  marginBottom: 4,
                }}>
                  <div style={{
                    height: "100%",
                    width: "100%",
                    background: "rgb(212,175,55)",
                    animation: "shimmer 1.2s ease-in-out infinite",
                  }} />
                </div>
                <span style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "0.7rem",
                  color: "rgba(212,175,55,0.6)",
                  fontStyle: "italic",
                }}>
                  Receiving model…
                </span>
              </div>
            )}
            <div style={styles.notifActions}>
              <button
                style={styles.btnAccept}
                disabled={isAccepting || loading}
                onClick={() => handleAcceptGift(giftId, modelKey)}
              >
                {isAccepting ? "Receiving…" : "Accept"}
              </button>
              <button
                style={styles.btnDecline}
                disabled={isAccepting || loading}
                onClick={() => handleDismissGift(giftId)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (n.type === "purchase_request") {
      const purchaseId = n.id.replace("purchase-", "");
      const modelName = getStr(d.offModel, "name");
      const modelPrice = getStr(d.offModel, "price");
      return (
        <div key={n.id} style={styles.notifItem}>
          <div style={styles.notifIcon}>💰</div>
          <div style={{ flex: 1 }}>
            <p style={styles.notifText}>
              <span style={styles.notifName}>{getStr(d.buyer, "nickname")}</span>{" "}
              wants to buy <span style={{ color: "rgb(212,175,55)" }}>{modelName}</span>
              {modelPrice ? ` for ${modelPrice} €` : ""}
            </p>
            <div style={styles.notifActions}>
              <button style={styles.btnAccept} disabled={loading} onClick={() => handlePurchaseAction(purchaseId, "accept")}>Confirm Sale</button>
              <button style={styles.btnDecline} disabled={loading} onClick={() => handlePurchaseAction(purchaseId, "decline")}>Decline</button>
            </div>
          </div>
        </div>
      );
    }

    if (n.type === "purchase_update") {
      const accepted = d.status === "ACCEPTED";
      const purchaseId = n.id.replace("purchase-update-", "");
      return (
        <div key={n.id} style={styles.notifItem}>
          <div style={styles.notifIcon}>{accepted ? "✅" : "❌"}</div>
          <div style={{ flex: 1 }}>
            <p style={styles.notifText}>
              Your purchase of{" "}
              <span style={{ color: "rgb(212,175,55)" }}>{getStr(d.offModel, "name")}</span>{" "}
              was {accepted ? "accepted" : "declined"} by{" "}
              <span style={styles.notifName}>{getStr(d.seller, "nickname")}</span>
            </p>
            <div style={styles.notifActions}>
              <button style={styles.btnAccept} disabled={loading} onClick={() => handlePurchaseSeenAction(purchaseId)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "relative",
          background: "transparent",
          border: "1px solid rgba(245,240,232,0.15)",
          borderRadius: 2,
          padding: "6px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgb(212,175,55)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(245,240,232,0.15)")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.6)" strokeWidth="1.6">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "rgb(212,175,55)", color: "#000", borderRadius: "50%",
            width: 16, height: 16, fontSize: "0.6rem",
            fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: 340, background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2,
          zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.7)", overflow: "hidden",
        }}>
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
          <div style={{
            padding: "10px 18px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase",
            color: "rgb(212,175,55)",
          }}>
            Notifications {count > 0 && `(${count})`}
          </div>

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <p style={{
                padding: "24px 18px",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "0.88rem", color: "rgba(245,240,232,0.25)",
                fontStyle: "italic", textAlign: "center",
              }}>
                No new notifications
              </p>
            ) : (
              notifications.map(renderNotification)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  notifItem: {
    display: "flex", gap: 12, padding: "14px 18px",
    borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "flex-start",
  },
  notifIcon: { fontSize: "1rem", marginTop: 1, flexShrink: 0 },
  notifText: {
    margin: "0 0 8px",
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: "0.88rem", color: "rgba(245,240,232,0.6)", lineHeight: 1.55,
  },
  notifName: { color: "#f5f0e8", fontWeight: 500 },
  notifActions: { display: "flex", gap: 8 },
  btnAccept: {
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.75rem",
    letterSpacing: "0.07em", padding: "4px 12px",
    background: "transparent",
    border: "1px solid rgba(212,175,55,0.4)", borderRadius: 2,
    color: "rgb(212,175,55)", cursor: "pointer", transition: "all 0.2s",
  },
  btnDecline: {
    fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.75rem",
    letterSpacing: "0.07em", padding: "4px 12px",
    background: "transparent",
    border: "1px solid rgba(210,90,90,0.3)", borderRadius: 2,
    color: "rgba(210,90,90,0.7)", cursor: "pointer", transition: "all 0.2s",
  },
};