import AddObjectButton from "@/components/(lobby)/addObjectButton";
import AddRenderedImageButton from "@/components/(lobby)/addRenderedImageButton";
import MyObjects from "@/components/(lobby)/myObjects";

export default function lobby() {
  return (
    <>
      <AddObjectButton />
      <AddRenderedImageButton />
      <MyObjects />
    </>
  );
}
