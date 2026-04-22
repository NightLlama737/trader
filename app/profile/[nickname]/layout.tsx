import type { Metadata } from "next";
import { cookies } from "next/headers";
import HeaderProfile from "@/components/profile/header";

export const metadata: Metadata = {
    title: "Profile",
  description: "User profile",

};

export default async function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get("user")?.value;
  let nickname: string | undefined;
  try { if (raw) nickname = JSON.parse(raw).nickname; } catch {}

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
          borderRadius: "4px",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 28px",
          zIndex: 100,
          maxWidth: "100vw",
        }}
        className="responsive-header"
      >
        <HeaderProfile nickname={nickname} />
      </header>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0a0a0a",
          minHeight: "100vh",
          width: "100vw",
          boxSizing: "border-box",
        }}
        className="responsive-content"
      >
        {children}
      </div>
    </>
  );
}