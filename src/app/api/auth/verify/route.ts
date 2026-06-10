import { NextRequest } from "next/server";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerifications } from "@/db/schema";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { verifyOtpSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/lib/api";
import { promoteAdminIfEligible } from "@/lib/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });
    if (!user) return jsonError("Account not found", 404);

    const verification = await db.query.emailVerifications.findFirst({
      where: and(
        eq(emailVerifications.userId, user.id),
        eq(emailVerifications.otp, otp),
        gt(emailVerifications.expiresAt, new Date())
      ),
    });
    if (!verification) {
      return jsonError("Invalid or expired verification code");
    }

    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, user.id));
    await promoteAdminIfEligible(user.id, {
      email: normalizedEmail,
      username: user.username,
    });
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.userId, user.id));

    const token = await createSessionToken(user.id);
    await setSessionCookie(token);

    return jsonOk({ verified: true });
  } catch (err) {
    console.error(err);
    return jsonError("Verification failed", 500);
  }
}
