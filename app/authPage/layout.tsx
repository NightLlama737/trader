import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Authentication page",
  description: "Auth of the traders",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
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
  );
}
