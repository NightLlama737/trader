import ProfileCard from "@/components/profile/profileCard";

type Props = {
  params: Promise<{ nickname: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { nickname } = await params;
  return <ProfileCard nickname={nickname} />;
}