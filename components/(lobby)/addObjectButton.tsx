"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddObjectButton() {
  const router = useRouter();
  return (
    <button className="btn-glass text-green-400 fixed left-[45%] bottom-5 w-[12%]" onClick={() => router.push("/lobby/addObject")}>[ Add model ]</button>
  );
}
