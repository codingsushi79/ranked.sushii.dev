import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import { sendVerificationOtp } from "@/lib/verification";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Unauthorized", 401);

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return jsonError("User not found", 404);
  if (user.emailVerified) {
    return jsonError("Email is already verified", 400);
  }

  try {
    await sendVerificationOtp(user.id, user.email);
    return jsonOk({ sent: true, email: user.email });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to send verification email", 500);
  }
}
