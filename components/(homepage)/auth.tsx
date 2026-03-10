"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTypewriter } from "./useTypeWriter";

export default function Auth() {
  const [emailOrNick, setEmailOrNick] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [showText, setShowText] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const animatedText =
    userExists === null
      ? "Enter your email or nickname"
      : userExists === true
      ? "Welcome back"
      : "Create your account";

  const title = useTypewriter(showText ? animatedText : "", 42);

  const findUser = async () => {
    const res = await fetch("/api/findUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrNick }),
    });
    const data = await res.json();
    setUserExists(data.user ? true : false);
  };

  const login = async () => {
    const res = await fetch("/api/logIn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrNick, password }),
    });
    if (res.ok) router.push("/lobby");
  };

  const signup = async () => {
    const res = await fetch("/api/signUp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nickname, password }),
    });
    if (res.ok) router.push("/lobby");
  };

  const S: React.CSSProperties = {
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

  const I: React.CSSProperties = {
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
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", width: "360px", flexDirection: "column", gap: 24 }}>

      <h2 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: 400,
        fontSize: "1.5rem",
        color: "#f5f0e8",
        letterSpacing: "0.03em",
        minHeight: "2.2rem",
        textAlign: "center",
      }}>
        {title}<span style={{ opacity: 0.35 }}>_</span>
      </h2>

      {userExists === null && (
        <>
          <label style={S}>
            Email or Nickname
            <input
              style={I}
              type="text"
              value={emailOrNick}
              onChange={(e) => setEmailOrNick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && findUser()}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)"}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)"}
            />
          </label>
          <button className="btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={findUser}>
            Continue
          </button>
        </>
      )}

      {userExists === true && (
        <>
          <label style={S}>
            Password
            <input
              style={I}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)"}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)"}
            />
          </label>
          <button className="btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={login}>
            Sign In
          </button>
        </>
      )}

      {userExists === false && (
        <>
          <label style={S}>
            Email
            <input style={I} type="text" value={email} onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)"}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)"} />
          </label>
          <label style={S}>
            Nickname
            <input style={I} type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)"}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)"} />
          </label>
          <label style={S}>
            Password
            <input style={I} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && signup()}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = "rgba(245,240,232,0.45)"}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = "rgba(255,255,255,0.12)"} />
          </label>
          <button className="btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={signup}>
            Create Account
          </button>
        </>
      )}
    </div>
  );
}