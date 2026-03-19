"use client";

import { useState, useEffect } from "react";

type PaymentDetails = {
  cardNumber?: string;
  cardHolder?: string;
  expiry?: string;
  iban?: string;
  paypal?: string;
};

type UserData = {
  id: string;
  email: string;
  nickname: string;
  credits: number;
  createdAt: string;
  paymentDetails?: PaymentDetails | null;
};

const LABEL: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "0.68rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(245,240,232,0.35)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: "100%",
};

const INPUT: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "1rem",
  fontWeight: 300,
  background: "transparent",
  color: "#f5f0e8",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  padding: "8px 0",
  outline: "none",
  caretColor: "#f5f0e8",
  width: "100%",
};

type Tab = "profile" | "security" | "payment";

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Profile fields
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  // Security fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Payment fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [iban, setIban] = useState("");
  const [paypal, setPaypal] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setNickname(d.user.nickname);
          setEmail(d.user.email);
          const pd = d.user.paymentDetails || {};
          setCardNumber(pd.cardNumber || "");
          setCardHolder(pd.cardHolder || "");
          setExpiry(pd.expiry || "");
          setIban(pd.iban || "");
          setPaypal(pd.paypal || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, email }),
      });
      const data = await res.json();
      if (!res.ok) showMsg(data.error || "Failed to save", false);
      else { showMsg("Profile updated", true); setUser((u) => u ? { ...u, nickname, email } : u); }
    } catch { showMsg("Network error", false); }
    setSaving(false);
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) { showMsg("Passwords do not match", false); return; }
    if (newPassword.length < 6) { showMsg("Password must be at least 6 characters", false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) showMsg(data.error || "Failed", false);
      else { showMsg("Password updated", true); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    } catch { showMsg("Network error", false); }
    setSaving(false);
  };

  const savePayment = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentDetails: { cardNumber, cardHolder, expiry, iban, paypal } }),
      });
      const data = await res.json();
      if (!res.ok) showMsg(data.error || "Failed", false);
      else showMsg("Payment details saved", true);
    } catch { showMsg("Network error", false); }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Cormorant Garamond', Georgia, serif", padding: 60 }}>
      Loading…
    </div>
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "payment", label: "Payment" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 840, padding: "40px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 400,
          fontSize: "1.6rem",
          color: "#f5f0e8",
          margin: 0,
          letterSpacing: "0.02em",
        }}>
          Settings
        </h1>
        {user && (
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "0.88rem",
            color: "rgba(245,240,232,0.3)",
            margin: "6px 0 0",
          }}>
            {user.nickname} · {user.credits} credits ·{" "}
            Member since {new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 40,
        gap: 0,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.9rem",
              letterSpacing: "0.06em",
              color: activeTab === tab.id ? "#fff" : "rgba(245,240,232,0.35)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "1px solid rgb(212,175,55)" : "1px solid transparent",
              padding: "10px 24px 10px 0",
              marginRight: 24,
              cursor: "pointer",
              transition: "color 0.2s",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {msg && (
        <div style={{
          marginBottom: 24,
          padding: "12px 18px",
          background: msg.ok ? "rgba(212,175,55,0.08)" : "rgba(210,90,90,0.08)",
          border: `1px solid ${msg.ok ? "rgba(212,175,55,0.3)" : "rgba(210,90,90,0.3)"}`,
          borderRadius: 2,
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "0.9rem",
          color: msg.ok ? "rgb(212,175,55)" : "rgba(210,90,90,0.9)",
        }}>
          {msg.text}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 480 }}>
          <SectionTitle>Personal Information</SectionTitle>

          <label style={LABEL}>
            Nickname
            <input
              style={INPUT}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
            />
          </label>

          <label style={LABEL}>
            Email Address
            <input
              type="email"
              style={INPUT}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
            />
          </label>

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              className="btn-primary"
              onClick={saveProfile}
              disabled={saving}
              style={{ minWidth: 120 }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          <div style={{
            marginTop: 16,
            padding: "18px 20px",
            background: "#111",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 2,
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.68rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              margin: "0 0 12px",
            }}>
              Account Statistics
            </p>
            <div style={{ display: "flex", gap: 32 }}>
              <Stat label="Credits" value={user?.credits ?? 0} />
              <Stat label="Member Since" value={user ? new Date(user.createdAt).getFullYear() : "—"} />
            </div>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 480 }}>
          <SectionTitle>Change Password</SectionTitle>

          <label style={LABEL}>
            Current Password
            <input
              type="password"
              style={INPUT}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
            />
          </label>

          <label style={LABEL}>
            New Password
            <input
              type="password"
              style={INPUT}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
            />
          </label>

          <label style={LABEL}>
            Confirm New Password
            <input
              type="password"
              style={INPUT}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
            />
          </label>

          <button
            className="btn-primary"
            onClick={savePassword}
            disabled={saving || !currentPassword || !newPassword}
            style={{ alignSelf: "flex-start", minWidth: 160 }}
          >
            {saving ? "Updating…" : "Update Password"}
          </button>
        </div>
      )}

      {/* PAYMENT TAB */}
      {activeTab === "payment" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 540 }}>

          <div style={{
            padding: "14px 18px",
            background: "rgba(212,175,55,0.04)",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 2,
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.82rem",
              color: "rgba(212,175,55,0.7)",
              margin: 0,
              lineHeight: 1.6,
            }}>
              Payment details are stored securely and used for processing trades. Fields left blank will not be updated.
            </p>
          </div>

          {/* Card Details */}
          <div>
            <SectionTitle>Card Details</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 16 }}>
              <label style={LABEL}>
                Card Number
                <input
                  style={INPUT}
                  value={cardNumber}
                  placeholder="•••• •••• •••• ••••"
                  maxLength={19}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
                />
              </label>

              <label style={LABEL}>
                Cardholder Name
                <input
                  style={INPUT}
                  value={cardHolder}
                  placeholder="Full name as on card"
                  onChange={(e) => setCardHolder(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
                />
              </label>

              <label style={{ ...LABEL, maxWidth: 160 }}>
                Expiry Date
                <input
                  style={INPUT}
                  value={expiry}
                  placeholder="MM / YY"
                  maxLength={7}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    if (v.length >= 3) v = v.slice(0, 2) + " / " + v.slice(2);
                    setExpiry(v);
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
                />
              </label>
            </div>
          </div>

          {/* Bank / Alternative */}
          <div>
            <SectionTitle>Alternative Payment</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 16 }}>
              <label style={LABEL}>
                IBAN
                <input
                  style={INPUT}
                  value={iban}
                  placeholder="CZ00 0000 0000 0000 0000 0000"
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
                />
              </label>

              <label style={LABEL}>
                PayPal Email
                <input
                  type="email"
                  style={INPUT}
                  value={paypal}
                  placeholder="paypal@example.com"
                  onChange={(e) => setPaypal(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)")}
                />
              </label>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={savePayment}
            disabled={saving}
            style={{ alignSelf: "flex-start", minWidth: 180 }}
          >
            {saving ? "Saving…" : "Save Payment Details"}
          </button>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: "0.68rem",
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.2)",
      margin: 0,
      paddingBottom: 12,
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      {children}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: "0.68rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.2)",
        margin: "0 0 4px",
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: "1.1rem",
        color: "#f5f0e8",
        margin: 0,
      }}>
        {value}
      </p>
    </div>
  );
}