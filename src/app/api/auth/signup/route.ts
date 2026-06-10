import { jsonError } from "@/lib/api";

export async function POST() {
  return jsonError(
    "Email signup is no longer supported. Create an account with Steam.",
    410
  );
}
