import SettingsPage from "@/components/settings/settingsPage";
import { cookies } from "next/headers";
import Header from "@/components/(lobby)/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Account settings",
};

export default async function Settings() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("user")?.value;
  let nickname: string | undefined;
  try { if (raw) nickname = JSON.parse(raw).nickname; } catch {}

  return (
    <>
      <header style={{
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
        <Header nickname={nickname} />
      </header>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#0a0a0a",
        minHeight: "100vh",
        paddingTop: 90,
        width: "100vw",
        boxSizing: "border-box",
      }}
      className="responsive-content"
      >
        <SettingsPage />
      </div>
    </>
  );
}