import type { Metadata } from "next";
import { cookies } from "next/headers";
import Header from "@/components/(dashboard)/header";

export const metadata: Metadata = {
  title: "Authentication page",
  description: "Auth of the traders",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("user")?.value;

  let nickname: string | undefined;
  try {
    if (raw) nickname = JSON.parse(raw).nickname;
  } catch {}

  return (
    <>
      <header
        style={{
          position: "fixed",
          width: "60%",
          marginTop: "20px",
          display: "flex",
          left: "20%",
          right: "20%",
          borderRadius: "70px",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "black",
        }}
      >
        <Header nickname={nickname} />
      </header>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#000",
          minHeight: "100vh",
          fontFamily: "monospace",
          color: "#fff",
        }}
      >
        {children}
      </div>
    </>
  );
}
