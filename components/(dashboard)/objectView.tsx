"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRouter, useSearchParams } from "next/navigation";

type OffModel = { id: string; key: string; name: string; description: string; price: number; userId: string };

type PaymentState = "idle" | "requesting" | "pending_payment" | "paying" | "done" | "error";

export default function ObjectView() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const wasCancelled = searchParams.get("purchase_cancelled") === "true";
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const [model, setModel] = useState<OffModel | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sellerHasAccount, setSellerHasAccount] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/getUserId").then((r) => r.json()).then((d) => setMyUserId(d.userId)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!key) return;
    fetch(`/api/offModels?key=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d) => {
        setModel(d.model);
        // Zkontroluj, jestli má prodejce nastavený účet
        if (d.model?.userId) {
          fetch(`/api/seller/bankAccount?userId=${d.model.userId}`)
            .then((r) => r.json())
            .then((sd) => setSellerHasAccount(!!sd.hasBankAccount))
            .catch(() => setSellerHasAccount(null));
        }
      })
      .catch(console.error);
  }, [key]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") router.push("/dashboard"); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [router]);

  useEffect(() => {
    if (!mountRef.current || !model || !key) return;
    const container = mountRef.current;

    if (rendererRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }
    container.innerHTML = "";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e0e0e);
    const camera = new THREE.PerspectiveCamera(60, 800 / 500, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 500);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const d = new THREE.DirectionalLight(0xffffff, 8); d.position.set(5, 5, 5); scene.add(d);

    fetch(`/api/getSignedUrl?key=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then(({ url }) => {
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
          const obj = gltf.scene; scene.add(obj);
          const box = new THREE.Box3().setFromObject(obj);
          obj.position.sub(box.getCenter(new THREE.Vector3()));
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = camera.fov * (Math.PI / 180);
          camera.position.set(0, maxDim * 0.4, (maxDim / (2 * Math.tan(fov / 2))) * 1.5);
          controls.target.set(0, 0, 0); controls.update();
        });
      });

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      rendererRef.current = null;
      container.innerHTML = "";
    };
  }, [model, key]);

  // Krok 1: Vytvoř purchase request
  const handleRequestPurchase = async () => {
    if (!model) return;
    setPaymentState("requesting");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offModelId: model.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setPurchaseId(data.purchase.id);
        setPaymentState("pending_payment");
      } else {
        setErrorMsg(data.error || "Failed to create purchase request");
        setPaymentState("error");
      }
    } catch {
      setErrorMsg("Network error");
      setPaymentState("error");
    }
  };

  // Krok 2: Zaplatit přes Stripe
  const handlePayWithStripe = async () => {
    if (!purchaseId) return;
    setPaymentState("paying");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      });
      const data = await res.json();
      if (res.ok && data.sessionUrl) {
        // Přesměruj na Stripe Checkout
        window.location.href = data.sessionUrl;
      } else {
        setErrorMsg(data.error || "Failed to start payment");
        setPaymentState("pending_payment");
      }
    } catch {
      setErrorMsg("Network error during payment");
      setPaymentState("pending_payment");
    }
  };

  const isOwner = myUserId && model && myUserId === model.userId;

  if (!key) return <p style={{ color: "#f5f0e8", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Missing key</p>;
  if (!model) return <p style={{ color: "#f5f0e8", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Loading…</p>;

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "80vh", background: "#0a0a0a",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      position: "relative",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "800px 300px", gap: 20 }}>
        <div ref={mountRef} style={{ width: 800, height: 500, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }} />

        <div style={{
          padding: "32px 28px", background: "#111",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, fontSize: "1.2rem", color: "#fff" }}>
            {model.name}
          </h3>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "rgba(245,240,232,0.5)", fontSize: "0.95rem", lineHeight: 1.65 }}>
            {model.description}
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: "rgba(245,240,232,0.7)", fontSize: "1.5rem", marginTop: "auto", letterSpacing: "0.02em" }}>
            {model.price} €
          </p>

          {/* Cancelled banner */}
          {wasCancelled && paymentState === "idle" && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(255,170,0,0.07)",
              border: "1px solid rgba(255,170,0,0.25)",
              borderRadius: 2,
              fontSize: "0.8rem",
              color: "rgba(255,190,60,0.85)",
            }}>
              Platba byla zrušena. Můžete to zkusit znovu.
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(210,90,90,0.07)",
              border: "1px solid rgba(210,90,90,0.3)",
              borderRadius: 2,
              fontSize: "0.82rem",
              color: "rgba(210,90,90,0.9)",
              lineHeight: 1.5,
            }}>
              {errorMsg}
            </div>
          )}

          {/* STEP 1 – Request purchase */}
          {!isOwner && paymentState === "idle" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sellerHasAccount === false && (
                <div style={{
                  padding: "9px 12px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 2,
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.25)",
                  fontStyle: "italic",
                }}>
                  Prodejce ještě nenastavil číslo účtu. Platba může být zpožděna.
                </div>
              )}
              <button className="btn-primary" onClick={handleRequestPurchase}>
                Koupit
              </button>
            </div>
          )}

          {/* STEP 1 loading */}
          {paymentState === "requesting" && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 2,
              fontSize: "0.82rem",
              color: "rgba(245,240,232,0.4)",
              fontStyle: "italic",
            }}>
              Připravuji objednávku…
            </div>
          )}

          {/* STEP 2 – Pay with Stripe */}
          {paymentState === "pending_payment" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                padding: "12px 14px",
                background: "rgba(212,175,55,0.07)",
                border: "1px solid rgba(212,175,55,0.3)",
                borderRadius: 2,
                fontSize: "0.82rem",
                color: "rgb(212,175,55)",
                lineHeight: 1.6,
              }}>
                ✓ Objednávka vytvořena. Dokončete platbu přes Stripe.
              </div>

              <button
                className="btn-primary"
                onClick={handlePayWithStripe}
                style={{
                  background: "rgba(99,91,255,0.1)",
                  borderColor: "rgba(99,91,255,0.4)",
                  color: "rgba(180,175,255,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99,91,255,0.18)";
                  e.currentTarget.style.borderColor = "rgba(99,91,255,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(99,91,255,0.1)";
                  e.currentTarget.style.borderColor = "rgba(99,91,255,0.4)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Zaplatit {model.price} € přes Stripe
              </button>

              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "0.68rem",
                color: "rgba(255,255,255,0.15)",
                margin: 0,
                textAlign: "center",
                fontStyle: "italic",
              }}>
                Budete přesměrováni na zabezpečenou platební stránku Stripe
              </p>
            </div>
          )}

          {/* Paying state */}
          {paymentState === "paying" && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(99,91,255,0.07)",
              border: "1px solid rgba(99,91,255,0.2)",
              borderRadius: 2,
              fontSize: "0.82rem",
              color: "rgba(180,175,255,0.8)",
              fontStyle: "italic",
            }}>
              Přesměrovávám na Stripe…
            </div>
          )}

          {/* Error – retry */}
          {paymentState === "error" && (
            <button className="btn-ghost" onClick={() => setPaymentState("idle")}>
              Zkusit znovu
            </button>
          )}

          {isOwner && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 2,
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.25)",
              fontStyle: "italic",
            }}>
              This is your listing
            </div>
          )}
        </div>
      </div>

      <p style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", fontSize: "0.7rem", color: "rgba(245,240,232,0.12)", letterSpacing: "0.1em", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        Press ESC to exit
      </p>
    </div>
  );
}