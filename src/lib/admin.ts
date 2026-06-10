import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import { isAdminEmail, isAdminUsername } from "@/lib/admin-config";
import { jsonError } from "@/lib/api";

export async function promoteAdminIfEligible(
  userId: string,
  opts?: { email?: string | null; username?: string }
) {
  const email = opts?.email;
  const username = opts?.username;
  if (
    !(email && isAdminEmail(email)) &&
    !(username && isAdminUsername(username))
  ) {
    return;
  }
  await db
    .update(users)
    .set({ isAdmin: true })
    .where(eq(users.id, userId));
}

export async function requireAdmin() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user?.isAdmin) return null;
  return user;
}

export async function requireAdminResponse() {
  const admin = await requireAdmin();
  if (!admin) {
    return jsonError("Forbidden", 403);
  }
  return admin;
}
