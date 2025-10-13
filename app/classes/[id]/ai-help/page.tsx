import AiHelpClient from "./Client";

export default async function AiHelpPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  return <AiHelpClient classId={id} />;
}
