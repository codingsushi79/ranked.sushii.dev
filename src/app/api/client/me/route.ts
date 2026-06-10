import { jsonError, jsonOk } from "@/lib/api";
import { authenticateClient } from "@/lib/client-auth";
import { getClientProfile } from "@/lib/client-profile";

export async function GET(request: Request) {
  const auth = await authenticateClient(request.headers.get("authorization"), {
    requireSteam: false,
  });
  if (!auth) {
    return jsonError(
      "Unauthorized — sign in with Steam from the desktop app",
      401
    );
  }

  const profile = await getClientProfile(auth.userId);
  if (!profile) return jsonError("User not found", 404);

  return jsonOk(profile);
}
