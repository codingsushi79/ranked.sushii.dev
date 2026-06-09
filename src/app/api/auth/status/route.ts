import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return jsonOk({ loggedIn: false });

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return jsonOk({ loggedIn: false });

  return jsonOk({
    loggedIn: true,
    email: user.email,
    emailVerified: user.emailVerified,
    username: user.username,
  });
}
