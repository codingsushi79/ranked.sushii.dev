import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashToken } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_RE.test(value);
}

export async function authenticateClient(
  authorization: string | null,
  options?: { requireSteam?: boolean }
): Promise<{ userId: string } | null> {
  const requireSteam = options?.requireSteam ?? true;
  if (!authorization?.startsWith("Bearer ")) return null;
  const credential = authorization.slice(7).trim();
  if (!credential) return null;

  if (isUuid(credential)) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, credential),
    });
    if (!user) return null;
    if (requireSteam && !user.steamId) return null;
    return { userId: user.id };
  }

  // Legacy random tokens (pre–client ID)
  const tokenHash = hashToken(credential);
  const legacy = await db.query.users.findFirst({
    where: eq(users.clientTokenHash, tokenHash),
  });
  if (!legacy) return null;
  if (requireSteam && !legacy.steamId) return null;
  return { userId: legacy.id };
}
