import Image from "next/image";

export default function Logo() {
  return (
    <Image
      style={{
        marginRight: "50px",
      }}
      src="/logo_invert.jpg"
      alt="Logo"
      width={200} // set appropriate width
      height={100} // set appropriate height
    />
  );
}
