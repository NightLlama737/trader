import Image from "next/image";

export default function Logo() {
  return (
    <Image
      className="mr-12"
      src="/logo_invert.jpg"
      alt="Logo"
      width={200}
      height={100}
    />
  );
}
