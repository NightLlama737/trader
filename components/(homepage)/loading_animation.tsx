"use client";

import { useEffect, useState } from "react";
import Logo from "./logo";

export default function LoadingAnimation() {
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    // Video zmizí po 5 sekundách, můžeš použít i onEnded v <video>
    const timer = setTimeout(() => setShowVideo(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!showVideo) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      <Logo />
      <video
        autoPlay
        muted
        playsInline
        style={{
          position: "fixed",

          width: "40vw",
          height: "40vh",
          objectFit: "fill",
          zIndex: 9999,
          border: "none",
          outline: "none",
        }}
      >
        <source src="./loading.mkv" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
