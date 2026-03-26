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

  const handleAcceptGift = async (giftId: string) => {
    setLoading(true);
    try {
      await fetch("/api/giftModel/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId }),
      });
      await fetchNotifications();
    } catch {}
    setLoading(false);
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
    // notifId is like "notif-<uuid>", strip prefix
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
              <button
                style={styles.btnDecline}
                disabled={loading}
                onClick={() => handleDismissFriendRemoved(n.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (n.type === "model_gift") {
      const giftId = n.id.replace("gift-", "");
      const msg = typeof d.message === "string" ? d.message : undefined;
      return (
        <div key={n.id} style={styles.notifItem}>
          <div style={styles.notifIcon}>🎁</div>
          <div style={{ flex: 1 }}>
            <p style={styles.notifText}>
              <span style={styles.notifName}>{getStr(d.sender, "nickname")}</span>{" "}
              sent you a model{msg ? `: "${msg}"` : ""}
            </p>
            <div style={styles.notifActions}>
              <button style={styles.btnAccept} disabled={loading} onClick={() => handleAcceptGift(giftId)}>Accept</button>
              <button style={styles.btnDecline} disabled={loading} onClick={() => handleDismissGift(giftId)}>Dismiss</button>
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
          <div style={{
            padding: "10px 18px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase",
            color: "rgb(212,175,55)",
          }}>
            Notifications {count > 0 && `(${count})`}
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
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
  notifItem: { display: "flex", gap: 12, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "flex-start" },
  notifIcon: { fontSize: "1rem", marginTop: 1, flexShrink: 0 },
  notifText: { margin: "0 0 8px", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.88rem", color: "rgba(245,240,232,0.6)", lineHeight: 1.5 },
  notifName: { color: "#f5f0e8", fontWeight: 500 },
  notifActions: { display: "flex", gap: 8 },
  btnAccept: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.75rem", letterSpacing: "0.07em", padding: "4px 12px", background: "transparent", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 2, color: "rgb(212,175,55)", cursor: "pointer", transition: "all 0.2s" },
  btnDecline: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.75rem", letterSpacing: "0.07em", padding: "4px 12px", background: "transparent", border: "1px solid rgba(210,90,90,0.3)", borderRadius: 2, color: "rgba(210,90,90,0.7)", cursor: "pointer", transition: "all 0.2s" },
};