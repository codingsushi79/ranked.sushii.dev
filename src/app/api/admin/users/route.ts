import { NextRequest } from "next/server";
import { requireAdminResponse } from "@/lib/admin";
import { listAdminUsers } from "@/lib/admin-data";
import { jsonOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  const admin = await requireAdminResponse();
  if (admin instanceof Response) return admin;

  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const users = await listAdminUsers(q);
  return jsonOk({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}
