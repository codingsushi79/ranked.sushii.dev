import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPlayerProfileData } from "@/lib/player-profile";
import { PlayerProfileContent } from "@/components/player-profile-content";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!user) notFound();

  const profile = await getPlayerProfileData(user.id);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6">
        <PlayerProfileContent profile={profile} />
      </div>
    </div>
  );
}
