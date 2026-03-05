import type { Metadata } from "next";
import "../globals.css";


export const metadata: Metadata = {
  title: "Trader homepage",
  description: "Homepage of traders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#000",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
