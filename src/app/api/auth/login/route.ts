import { jsonError } from "@/lib/api";

export async function POST() {
  return jsonError("Email login is no longer supported. Sign in with Steam.", 410);
}
