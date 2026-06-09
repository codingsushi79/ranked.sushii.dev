import { NextRequest } from "next/server";
import { requireAdminResponse } from "@/lib/admin";
import { deleteMatchAndRevertStats } from "@/lib/admin-data";
import { jsonError, jsonOk } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminResponse();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const deleted = await deleteMatchAndRevertStats(id);
  if (!deleted) return jsonError("Match not found", 404);
  return jsonOk({ deleted: true });
}
