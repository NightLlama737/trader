"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./logo";

export default function Header() {
  const router = useRouter();
  return (
    <>
      <div className="w-full flex flex-row">
        <button className="btn-glass text-green-400 ml-[2%] mt-5 w-[12%]" onClick={() => router.push("/dashboard")}>[ Trading ]</button>
        <button className="btn-glass text-green-400 ml-[2%] mt-5 w-[12%]" onClick={() => router.push("/dashboard")}>[ Setting ]</button>
        <button className="btn-glass text-green-400 ml-[2%] mt-5 w-[12%]" onClick={() => router.push("/")}>[ Exit ]</button>
      </div>
      <Logo />
    </>
  );
}
