"use client"

import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/authPage");
  }
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HERO */}
      <section
        style={{
          textAlign: "center",
          padding: "120px 20px",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            color: "rgba(212,175,55,0.55)",
            marginBottom: "20px",
          }}
        >
          TRADER
        </h1>

        <p
          style={{
            color: "#aaa",
            maxWidth: "600px",
            margin: "0 auto 30px",
            fontSize: "20px",
          }}
        >
          Upload your .glb models and renders, connect with creators,
          and sell your work in a premium 3D marketplace.
        </p>

        
      </section>

      {/* FEATURES */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          padding: "40px",
        }}
      >
        {[
          {
            title: "Upload Models",
            text: "Share your .glb 3D models and renders with the world.",
          },
          {
            title: "Social System",
            text: "Add friends, follow creators, and discover new content.",
          },
          {
            title: "Marketplace",
            text: "Sell your models or explore assets from others.",
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: "#111",
              padding: "20px",
              borderRadius: "15px",
              border: "1px solid rgba(250, 204, 21, 0.2)",
            }}
          >
            <h3 style={{ color: "rgba(212,175,55,0.55)", marginBottom: "10px" }}>
              {item.title}
            </h3>
            <p style={{ color: "#aaa" }}>{item.text}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "60px 20px 120px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            color: "rgba(212,175,55,0.55)",
            marginBottom: "10px",
          }}
        >
          Ready to join the 3D community?
        </h2>

        <p style={{ color: "#aaa", marginBottom: "30px" }}>
          Start building your portfolio, connect with creators, and earn from your work.
        </p>

        <button
            style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(245,240,232,0.25)",
                padding: "9px 26px",
                borderRadius: "2px",
                cursor: "pointer",
          }}
            onClick={handleGetStarted}
        >
          Get started
        </button>
      </section>
    </main>
  );
}
