import DecisionView from "@/app/components/DecisionView";

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DecisionView id={id} />;
}
