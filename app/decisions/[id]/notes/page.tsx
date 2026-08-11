import DecisionNotes from "@/app/components/DecisionNotes";

export default async function DecisionNotesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DecisionNotes decisionId={id} />;
}
