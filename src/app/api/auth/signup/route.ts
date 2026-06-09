import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/lib/api";
import { isAdminEmail, isAdminUsername } from "@/lib/admin-config";
import { promoteAdminIfEligible } from "@/lib/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { username, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const termsAcceptedAt = new Date();

    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });
    if (existing?.emailVerified) {
      return jsonError("An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let userId: string;

    if (existing) {
      userId = existing.id;
      await db
        .update(users)
        .set({
          username,
          passwordHash,
          termsAcceptedAt,
          ...(isAdminEmail(normalizedEmail) || isAdminUsername(username)
            ? { isAdmin: true }
            : {}),
        })
        .where(eq(users.id, existing.id));
    } else {
      const usernameTaken = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      if (usernameTaken) {
        return jsonError("Username is already taken", 409);
      }

      const [created] = await db
        .insert(users)
        .values({
          username,
          email: normalizedEmail,
          passwordHash,
          termsAcceptedAt,
          isAdmin:
            isAdminEmail(normalizedEmail) || isAdminUsername(username),
        })
        .returning();
      userId = created.id;
    }

    await promoteAdminIfEligible(userId, normalizedEmail, username);

    const token = await createSessionToken(userId);
    await setSessionCookie(token);

    return jsonOk({
      loggedIn: true,
      email: normalizedEmail,
      needsVerification: true,
    });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to sign up", 500);
  }
}
