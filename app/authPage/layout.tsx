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
        background: "black",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
