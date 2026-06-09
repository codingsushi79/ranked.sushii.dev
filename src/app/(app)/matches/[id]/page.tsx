import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/matches";
import { MatchDetailView } from "@/components/match-detail-view";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchDetail(id);
  if (!match) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <MatchDetailView match={match} />
    </div>
  );
}
