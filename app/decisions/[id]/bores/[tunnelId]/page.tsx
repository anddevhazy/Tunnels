import BoreNotes from "@/app/components/BoreNotes";

export default async function BorePage({
  params,
}: {
  params: Promise<{ id: string; tunnelId: string }>;
}) {
  const { id, tunnelId } = await params;
  return <BoreNotes decisionId={id} tunnelId={tunnelId} />;
}
