import Image from "next/image";

export default function Logo() {
  return (
    <div
      style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
      }}
    >
      <Image src="/logo_invert.jpg" alt="Logo" width={300} height={200} />
    </div>
  );
}
