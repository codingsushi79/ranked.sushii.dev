import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAdminResponse } from "@/lib/admin";
import { updateUserAdmin, verifyUserEmail } from "@/lib/admin-data";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api";

const patchSchema = z.object({
  isAdmin: z.boolean().optional(),
  emailVerified: z.literal(true).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminResponse();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const target = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!target) return jsonError("User not found", 404);

  if (parsed.data.isAdmin !== undefined) {
    if (target.id === admin.id && !parsed.data.isAdmin) {
      return jsonError("You cannot revoke your own admin access", 400);
    }
    const user = await updateUserAdmin(id, parsed.data.isAdmin);
    return jsonOk({ user });
  }

  if (parsed.data.emailVerified) {
    const user = await verifyUserEmail(id);
    return jsonOk({ user });
  }

  return jsonError("No changes requested");
}
