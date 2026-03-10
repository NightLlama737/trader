import SendModelPage from "@/components/profile/sendModel";

type Props = {
  params: Promise<{ nickname: string }>;
};

export default async function SendModelRoute({ params }: Props) {
  const { nickname } = await params;
  return <SendModelPage nickname={nickname} />;
}