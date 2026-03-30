"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PurchaseSuccess() {
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get("purchaseId");
  const sessionId = searchParams.get("session_id");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!purchaseId || !sessionId) {
      setStatus("error");
      return;
    }

    const timer = setTimeout(() => {
      setStatus("success");
    }, 1500);

    return () => clearTimeout(timer);
  }, [purchaseId, sessionId]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push("/lobby");
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 28,
      padding: 40,
    }}>
      {status === "loading" && (
        <>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            borderTop: "1px solid rgba(255,255,255,0.3)",
            animation: "spin 0.7s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1rem",
            color: "rgba(245,240,232,0.4)",
            margin: 0,
          }}>
            Ověřuji platbu…
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            background: "rgba(212,175,55,0.06)",
            animation: "fadeIn 0.4s ease",
          }}>
            ✓
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }`}</style>

          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 400,
              fontSize: "1.6rem",
              color: "#f5f0e8",
              margin: 0,
            }}>
              Platba proběhla úspěšně
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1rem",
              color: "rgba(245,240,232,0.4)",
              margin: 0,
            }}>
              Model byl přidán do vaší knihovny.
            </p>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.18)",
              margin: 0,
              fontStyle: "italic",
            }}>
              Přesměrovávám do vaší knihovny…
            </p>
          </div>

          <button
            onClick={() => router.push("/lobby")}
            style={{
              background: "transparent",
              border: "1px solid rgba(245,240,232,0.2)",
              borderRadius: 2,
              color: "rgba(245,240,232,0.6)",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.9rem",
              padding: "10px 28px",
              cursor: "pointer",
              transition: "all 0.2s",
              letterSpacing: "0.06em",
              marginTop: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgb(212,175,55)";
              e.currentTarget.style.color = "#f5f0e8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(245,240,232,0.2)";
              e.currentTarget.style.color = "rgba(245,240,232,0.6)";
            }}
          >
            Přejít do knihovny
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "1px solid rgba(210,90,90,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
            background: "rgba(210,90,90,0.05)",
          }}>
            ✕
          </div>
          <div style={{ textAlign: "center" }}>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 400,
              fontSize: "1.4rem",
              color: "#f5f0e8",
              margin: "0 0 10px",
            }}>
              Něco se pokazilo
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "0.9rem",
              color: "rgba(245,240,232,0.35)",
              margin: 0,
            }}>
              Pokud byla platba odečtena, kontaktujte podporu s ID: {purchaseId || "unknown"}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary"
          >
            Zpět na přehled
          </button>
        </>
      )}
    </div>
  );
}