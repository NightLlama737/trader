import type { Metadata } from "next";
import Header from "@/components/(lobby)/header";

export const metadata: Metadata = {
  title: "Authentication page",
  description: "Auth of the traders",
};

export default function LobbyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header
        style={{
          position: "fixed",
          width: "100%",
          borderBottom: "2px dashed green",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "black",
        }}
      >
        <Header />
      </header>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "black",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </>
  );
}
