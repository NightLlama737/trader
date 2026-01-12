import Auth from "@/components/(homepage)/auth";
import LoadingAnimation from "@/components/(homepage)/loading_animation";

export default function AuthPage() {
  return (
    <>
      <LoadingAnimation />
      <Auth />
    </>
  );
}
