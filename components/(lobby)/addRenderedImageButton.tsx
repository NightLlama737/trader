"use client";
import { useRouter } from "next/navigation";

export default function AddRenderedImageButton() {
  const router = useRouter();
  return (
    <button
      className="btn-primary"
      style={{
        position: "fixed",
        left: "40%",
        transform: "translateX(-50%)",
        bottom: 36,
        zIndex: 10,
        minWidth: 160,
      }}
      onClick={() => router.push("/lobby/addRenderedImage")}
    >
      Add Image
    </button>
  );
}