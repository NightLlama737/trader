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
            marginLeft: "1%",
            marginTop: "20px",
            height: "40px",

            borderRadius: "5px",
            color: "white",
            border: "1px solid aqua",
            width: "10%",
            backgroundColor: "black",
          }}
          onClick={() => router.push("/dashboard")}
        >
          Trading
        </button>

        <button
          style={{
            marginLeft: "1%",

            marginTop: "20px",
            height: "40px",

            borderRadius: "5px",
            color: "white",
            border: "1px solid aqua",
            width: "10%",
            backgroundColor: "black",
          }}
          onClick={() => router.push("/dashboard")}
        >
          Settings
        </button>
        <button
          style={{
            marginLeft: "1%",

            marginTop: "20px",
            height: "40px",
            marginBottom: "20px",
            borderRadius: "5px",
            color: "white",
            border: "1px solid aqua",
            width: "10%",
            backgroundColor: "black",
          }}
          onClick={() => router.push("/")}
        >
          Exit
        </button>
      </div>
      <Logo />
    </>
  );
}
