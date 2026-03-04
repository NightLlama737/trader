"use client"
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

function HammerModel() {
  const { scene, animations } = useGLTF('/hammer.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = actions[Object.keys(actions)[0]];
      firstAction?.reset().play();
    }
  }, [actions]);

  return <primitive object={scene} />;
}

export default function FirstPage() {
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCenterX(window.innerWidth / 2);
    setCenterY(window.innerHeight / 2);
    document.body.style.cursor = 'none';

    // Jakákoliv interakce odemkne autoplay
    const unlock = () => setUserInteracted(true);
    window.addEventListener("mousedown", unlock, { once: true });
    window.addEventListener("mousemove", unlock, { once: true });

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener("mousedown", unlock);
      window.removeEventListener("mousemove", unlock);
    };
  }, []);

  const [offsetY, setOffsetY] = useState(0);
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [loadingCircle, setLoadingCircle] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const arrowEndY = centerY + 200;
  const maxOffsetY = arrowEndY - centerY;

  const triggerAnimation = () => {
    setAnimationTriggered(true);
    setLoadingKey(k => k + 1);
    setLoadingCircle(true);
    loadingTimeout.current = setTimeout(() => {
      setLoadingCircle(false);
      setShowVideo(true);
    }, 1000);
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (animationTriggered) return;

      const delta = Math.max(0, Math.min(e.clientY - centerY, maxOffsetY));
      setOffsetY(delta);

      if (delta >= maxOffsetY) {
        triggerAnimation();
      }
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [animationTriggered, centerX, centerY, maxOffsetY]);

  // Spustí video až je userInteracted true
  useEffect(() => {
    if (showVideo && userInteracted && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [showVideo, userInteracted]);

  const handleVideoEnded = () => {
    setVideoFading(true);
    setTimeout(() => {
      document.body.style.cursor = 'default';
      router.push('/authPage');
    }, 1200);
  };

  useEffect(() => {
    if (loadingCircle && offsetY < maxOffsetY) {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
        loadingTimeout.current = null;
      }
      setLoadingCircle(false);
      setAnimationTriggered(false);
    }
  }, [offsetY, loadingCircle, maxOffsetY]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'fixed', top: 0, left: 0, cursor: 'none' }}>

      <style>{`
        * { cursor: none !important; }
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

      <Canvas camera={{ position: [2, 0.5, 0], fov: 40 }} shadows>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1.5} castShadow />
        <Suspense fallback={null}>
          <HammerModel />
        </Suspense>
      </Canvas>

      {/* Fullscreen video overlay */}
      {showVideo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "black" }}>
          <video
            ref={videoRef}
            src="/hammer_boom.mkv"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onEnded={handleVideoEnded}
            playsInline
            muted={false}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "black",
              opacity: videoFading ? 1 : 0,
              transition: videoFading ? "opacity 1.2s ease-in" : "none",
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {isClient && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>

          {/* Vertikální linka s šipkou */}
          <div style={{
            position: "absolute",
            left: centerX - 1,
            top: centerY + 20,
            width: 2,
            height: offsetY,
            background: "white",
            pointerEvents: "none",
            transition: "0.05s linear"
          }}>
            <div style={{
              position: "absolute",
              top: offsetY - 10,
              left: -5,
              width: 12,
              height: 12,
              borderLeft: "2px solid white",
              borderBottom: "2px solid white",
              transform: "rotate(-45deg)"
            }} />
          </div>

          {/* Dolní kruh + loading ring */}
          <div style={{ position: "absolute", left: centerX - 25, top: arrowEndY - 25, width: 50, height: 50 }}>
            <div style={{
              position: "absolute",
              inset: 0,
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

          {/* Pohyblivý kruh */}
          <div
            style={{
              position: "absolute",
              left: centerX - 20,
              top: centerY - 20 + offsetY,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px solid white",
              background: "transparent",
              boxSizing: "border-box",
            }}
          />

        </div>
      )}
    </div>
  );
}

// @ts-ignore
useGLTF.preload('/hammer.glb');
