import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Auth of the traders",
};

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#0a0a0a",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}