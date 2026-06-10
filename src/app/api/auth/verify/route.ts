import { jsonError } from "@/lib/api";

export async function POST() {
  return jsonError("Email verification is no longer used. Sign in with Steam.", 410);
}
