import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerifications } from "@/db/schema";
import { generateOtp } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { jsonError } from "@/lib/api";

export const VERIFY_TO_PLAY_MSG =
  "Verify your email before playing ranked matches";

export async function sendVerificationOtp(userId: string, email: string) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.userId, userId));
  await db.insert(emailVerifications).values({
    userId,
    otp,
    expiresAt,
  });

  await sendVerificationEmail(email, otp);
}

export async function requireVerifiedUser(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return { user: null, error: jsonError("Unauthorized", 401) };
  if (!user.emailVerified) {
    return { user: null, error: jsonError(VERIFY_TO_PLAY_MSG, 403) };
  }
  return { user, error: null };
}

export function canPlayRanked(emailVerified: boolean) {
  return emailVerified;
}
