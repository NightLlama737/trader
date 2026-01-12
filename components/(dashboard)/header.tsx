"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./logo";

export default function Header() {
  const router = useRouter();
  return (
    <>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <button
          style={{
            marginLeft: "2%",
            marginTop: "20px",
            padding: "0px",
            borderRadius: "5px",
            color: "green",
            border: "none",
            width: "12%",
            backgroundColor: "black",
            fontFamily: "monospace", // CLI font
            cursor: "pointer", // ukazatel
            transition: "background-color 0.3s", // plynulá změna barvy
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "lightgreen")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "green")}
          onClick={() => router.push("/lobby")}
        >
          <h1 style={{ margin: 0 }}>[ Lobby ]</h1>
        </button>

        <button
          style={{
            marginLeft: "2%",
            marginTop: "20px",
            padding: "0px",
            borderRadius: "5px",
            color: "green",
            border: "none",
            width: "12%",
            backgroundColor: "black",
            fontFamily: "monospace", // CLI font
            cursor: "pointer", // ukazatel
            transition: "background-color 0.3s", // plynulá změna barvy
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "lightgreen")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "green")}
          onClick={() => router.push("/dashboard")}
        >
          <h1 style={{ margin: 0 }}>[ Setting ]</h1>
        </button>
        <button
          style={{
            marginLeft: "2%",
            marginTop: "20px",
            padding: "0px",
            borderRadius: "5px",
            color: "green",
            border: "none",
            width: "12%",
            backgroundColor: "black",
            fontFamily: "monospace", // CLI font
            cursor: "pointer", // ukazatel
            transition: "background-color 0.3s", // plynulá změna barvy
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "lightgreen")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "green")}
          onClick={() => router.push("/")}
        >
          <h1 style={{ margin: 0 }}>[ Exit ]</h1>
        </button>
      </div>
      <Logo />
    </>
  );
}
