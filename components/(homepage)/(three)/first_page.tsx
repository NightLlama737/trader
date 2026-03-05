"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Suspense } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

/* ─────────────────────────────────────────────
   Fáze aplikace:
   "loading"   – loading bar, 3D model se načítá na pozadí
   "clickable" – "click to start" uprostřed
   "text1"     – sidebar text1 + kruhy; přejetím kruhu → text2
   "text2"     – sidebar text2 + kruhy + spustí hammer anim jednou;
                 přejetím kruhu → text3
   "text3"     – sidebar text3 + kruhy; přejetím kruhu → slide
   "slide"     – kamera zoom o 200 + video → authPage
───────────────────────────────────────────── */
type Phase = "loading" | "clickable" | "text1" | "text2" | "text3" | "slide";

const CIRCLE_PHASES: Phase[] = ["text1", "text2", "text3"];

/* ── Hammer 3D model ── */
function HammerModel({
  playAnim,
  onAnimEnd,
  onLoaded,
}: {
  playAnim: boolean;
  onAnimEnd: () => void;
  onLoaded: () => void;
}) {
  const { scene, animations } = useGLTF("/hammer.glb");
  const { actions } = useAnimations(animations, scene);
  const loadedRef = useRef(false);
  const calledRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !scene) return;
    loadedRef.current = true;
    onLoaded();
  }, [scene, onLoaded]);

  useEffect(() => {
    if (!playAnim || !actions || Object.keys(actions).length === 0) return;
    calledRef.current = false;
    const action = actions[Object.keys(actions)[0]];
    if (!action) return;
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    const duration = action.getClip().duration * 1000;
const timer = setTimeout(() => {
  if (!calledRef.current) {
    calledRef.current = true;
    // Vrátit model na první frame
    action.stop();
    action.time = 0;
    action.getMixer().update(0);
    onAnimEnd();
  }
}, duration);
    return () => clearTimeout(timer);
  }, [playAnim, actions, onAnimEnd]);

  return <primitive object={scene} />;
}

/* ── Kamera zoom při fázi "slide" ── */
function CameraController({ phase, onDone }: { phase: Phase; onDone: () => void }) {
  const { camera } = useThree();
  const startZ = useRef(0);
  const targetZ = useRef(0);
  const t = useRef(0);
  const active = useRef(false);
  const doneCalled = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (phase !== "slide") return;
    startZ.current = camera.position.z;
    targetZ.current = camera.position.z - 200;
    t.current = 0;
    active.current = true;
    doneCalled.current = false;
  }, [phase, camera]);

  useFrame(() => {
    if (!active.current) return;
    t.current = Math.min(t.current + 0.025, 1);
    camera.position.z = THREE.MathUtils.lerp(startZ.current, targetZ.current, t.current);
    if (t.current >= 1) {
      active.current = false;
      if (!doneCalled.current) {
        doneCalled.current = true;
        onDoneRef.current();
      }
    }
  });

  return null;
}

/* ── Pulzující šipka "click to start" ── */
function Arrow45() {
  return (
    <div style={{ position: "relative", width: 60, height: 60 }}>
      <style>{`
        @keyframes arrow-pulse {
          0%   { transform: translate(0px,  0px);  opacity: 1;   }
          50%  { transform: translate(12px, 12px); opacity: 0.4; }
          100% { transform: translate(0px,  0px);  opacity: 1;   }
        }
        .arrow-anim { animation: arrow-pulse 1.2s ease-in-out infinite; }
      `}</style>
      <div className="arrow-anim">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <line x1="10" y1="10" x2="48" y2="48" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <polyline points="28,48 48,48 48,28" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}

/* ── Loading bar ── */
function LoadingBar({ progress }: { progress: number }) {
  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#000", zIndex: 200, fontFamily: "monospace", color: "#fff", gap: 20,
    }}>
      <div style={{ fontSize: "1rem", letterSpacing: 4 }}>LOADING</div>
      <div style={{ width: 300, height: 2, background: "#222", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: "#fff", transition: "width 0.3s ease", borderRadius: 2,
        }} />
      </div>
      <div style={{ fontSize: "0.75rem", color: "#555" }}>{Math.round(progress)}%</div>
    </div>
  );
}

/* ── Levý sidebar ── */
function SidePanel({ visible, text }: { visible: boolean; text: string }) {
  return (
    <div style={{
      position: "fixed", left: 0, top: 0,
      width: "35vw", height: "100vh",
      background: "rgba(15,15,15,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 48px",
      fontFamily: "monospace", color: "#fff", fontSize: "0.95rem", lineHeight: 1.8,
      zIndex: 50,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-60px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
      pointerEvents: "none",
    }}>
      <p style={{ margin: 0 }}>{text}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function FirstPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [playHammerAnim, setPlayHammerAnim] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Kruhy
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [loadingCircle, setLoadingCircle] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);
  const circleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<Phase>("loading");
  const dragStartY = useRef<number | null>(null); // Y kde začal drag

  // Synchronizace phaseRef s phase state
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const showCircles = CIRCLE_PHASES.includes(phase);
  const arrowEndY = centerY + 200;
  const maxOffsetY = 200;

  // Loading progress simulace
  useEffect(() => {
    let val = 0;
    const iv = setInterval(() => {
      val += Math.random() * 18;
      if (val >= 95) { val = 95; clearInterval(iv); }
      setLoadProgress(val);
    }, 120);
    return () => clearInterval(iv);
  }, []);

  // Model načten
  const handleModelLoaded = useCallback(() => {
    setLoadProgress(100);
    setTimeout(() => setPhase("clickable"), 500);
  }, []);

  // Kliknutí → text1 + inicializuj kruhy
  const handleClick = () => {
    if (phase !== "clickable") return;
    setCenterX(window.innerWidth / 2);
    setCenterY(window.innerHeight / 2);
    setOffsetY(0);
    setTriggered(false);
    setPhase("text1");
  };

  // Přechod na další fázi po přejetí kruhu
  const advancePhase = useCallback(() => {
    const current = phaseRef.current;
    setLoadingCircle(false);
    setTriggered(false);
    setOffsetY(0);
    // Zachovej kruhy uprostřed obrazovky (X), ale Y anchor = aktuální mouseY
    // → offsetY = mouseY - newCenterY = 0, kruh nezačne načítat hned
    setCenterX(window.innerWidth / 2);
    setCenterY(window.innerHeight / 2);
    dragStartY.current = null;

    if (current === "text1") {
      setPhase("text2");
      setPlayHammerAnim(true);        // spustí hammer animaci jednou
    } else if (current === "text2") {
      setPhase("text3");
            setPlayHammerAnim(true);        // spustí hammer animaci jednou

    } else if (current === "text3") {

      setPhase("slide");

      // video se spustí až po dokončení zoom animace (handleZoomDone)
    }
  }, []);

  // Hammer anim skončila → nic, user musí sám přejet kruhem
  const handleHammerAnimEnd = useCallback(() => {
    setPlayHammerAnim(false);
  }, []);

  // Zoom dokončen → teprve teď spustit video
  const handleZoomDone = useCallback(() => {
    setShowVideo(true);
  }, []);

  // Drag logika – aktivní jen když jsou kruhy vidět
  useEffect(() => {
    if (!showCircles) return;

    const onDown = (e: MouseEvent) => {
      dragStartY.current = e.clientY;
      setOffsetY(0);
      setTriggered(false);
      setLoadingCircle(false);
      if (circleTimeout.current) clearTimeout(circleTimeout.current);
    };

    const onMove = (e: MouseEvent) => {
      if (dragStartY.current === null) return;
      if (triggered) return;
      const delta = Math.max(0, Math.min(e.clientY - dragStartY.current, maxOffsetY));
      setOffsetY(delta);

      if (delta >= maxOffsetY) {
        setTriggered(true);
        setLoadingKey((k) => k + 1);
        setLoadingCircle(true);
        circleTimeout.current = setTimeout(() => {
          advancePhase();
        }, 1000);
      }
    };

    const onUp = () => {
      if (triggered) return; // nechej loading ring doběhnout
      dragStartY.current = null;
      setOffsetY(0);
      setLoadingCircle(false);
      if (circleTimeout.current) clearTimeout(circleTimeout.current);
    };

    window.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [showCircles, triggered, maxOffsetY, advancePhase]);

  // Spustit video
  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [showVideo]);

  const handleVideoEnded = () => {
    setVideoFading(true);
    setTimeout(() => {
      router.push("/authPage");
    }, 1200);
  };

  const TEXT1 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.";
  const TEXT2 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget.";
  const TEXT3 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Cras justo odio, dapibus ac facilisis in, egestas eget quam.";

  return (
    <div
      style={{
        width: "100vw", height: "100vh",
        background: "#000",
        position: "fixed", top: 0, left: 0,
        overflow: "hidden",
      }}
      onClick={handleClick}
    >
      <style>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-conic {
          from { --angle: 0deg; }
          to   { --angle: 360deg; }
        }
        .loading-ring {
          border-radius: 50%;
          animation: spin-conic 1s linear forwards;
          background: conic-gradient(white var(--angle), transparent var(--angle));
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), white calc(100% - 3px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 3px), white calc(100% - 3px));
        }
      `}</style>

      {/* ── 3D Canvas ── */}
      <Canvas camera={{ position: [2, 0.5, 0], fov: 40 }} shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1.5} castShadow />
        <CameraController phase={phase} onDone={handleZoomDone} />
        <Suspense fallback={null}>
          <HammerModel
            playAnim={playHammerAnim}
            onAnimEnd={handleHammerAnimEnd}
            onLoaded={handleModelLoaded}
          />
        </Suspense>
      </Canvas>

      {/* ── Loading overlay ── */}
      {phase === "loading" && <LoadingBar progress={loadProgress} />}

      {/* ── Click to start ── */}
      {phase === "clickable" && (
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 24, zIndex: 100, cursor: "pointer",
        }}>
          <div style={{
            fontFamily: "monospace", fontSize: "1.5rem",
            color: "#fff", letterSpacing: 6, textTransform: "uppercase",
          }}>
            click to start
          </div>
          <Arrow45 />
        </div>
      )}

      {/* ── Sidebary — každý viditelný ve své fázi ── */}
      <SidePanel visible={phase === "text1"} text={TEXT1} />
      <SidePanel visible={phase === "text2"} text={TEXT2} />
      <SidePanel visible={phase === "text3"} text={TEXT3} />

      {/* ── Kruhy — viditelné ve všech text fázích ── */}
      {showCircles && centerX > 0 && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>

          {/* Vertikální linka + šipka dolů */}
          <div style={{
            position: "absolute",
            left: centerX - 1,
            top: centerY + 20,
            width: 2,
            height: offsetY,
            background: "white",
          }}>
            <div style={{
              position: "absolute",
              top: offsetY - 10,
              left: -5,
              width: 12,
              height: 12,
              borderLeft: "2px solid white",
              borderBottom: "2px solid white",
              transform: "rotate(-45deg)",
            }} />
          </div>

          {/* Dolní cílový kruh */}
          <div style={{
            position: "absolute",
            left: centerX - 25,
            top: arrowEndY - 25,
            width: 50, height: 50,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "50%",
              border: "2px solid white",
              opacity: loadingCircle ? 0.15 : 1,
              boxSizing: "border-box",
              transition: "opacity 0.15s",
            }} />
            {loadingCircle && (
              <div
                key={loadingKey}
                className="loading-ring"
                style={{ position: "absolute", inset: 0 }}
              />
            )}
          </div>

          {/* Pohyblivý kruh (custom kurzor) */}
          <div style={{
            position: "absolute",
            left: centerX - 20,
            top: centerY - 20 + offsetY,
            width: 40, height: 40,
            borderRadius: "50%",
            border: "2px solid white",
            background: "transparent",
            boxSizing: "border-box",
          }} />
        </div>
      )}

      {/* ── Video overlay ── */}
      {showVideo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000" }}>
          <video
            ref={videoRef}
            src="/hammer_boom.mkv"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onEnded={handleVideoEnded}
            playsInline
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "#000",
            opacity: videoFading ? 1 : 0,
            transition: videoFading ? "opacity 1.2s ease-in" : "none",
            pointerEvents: "none",
          }} />
        </div>
      )}
    </div>
  );
}

// @ts-ignore
useGLTF.preload("/hammer.glb");
