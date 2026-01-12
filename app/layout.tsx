import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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
          fontFamily: "monospace", // CLI font
          color: "green",
          padding: 0,
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
