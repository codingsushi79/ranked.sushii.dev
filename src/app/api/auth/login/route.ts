import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/lib/api";
import { promoteAdminIfEligible } from "@/lib/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { email, password } = parsed.data;
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return jsonError("Invalid email or password", 401);
    }

    await promoteAdminIfEligible(user.id, user.email, user.username);

    const token = await createSessionToken(user.id);
    await setSessionCookie(token);

    return jsonOk({ loggedIn: true });
  } catch (err) {
    console.error(err);
    return jsonError("Login failed", 500);
  }
}
