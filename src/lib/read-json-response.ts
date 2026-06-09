/** Parse a fetch Response as JSON, with a clear error when the server returns HTML. */
export async function readJsonResponse<T extends Record<string, unknown>>(
  res: Response
): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    if (/^\s*</.test(text)) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Session expired — sign in again.");
      }
      throw new Error(
        "Unexpected server response. Refresh the page and try again."
      );
    }
    throw new Error(text.slice(0, 160) || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}
