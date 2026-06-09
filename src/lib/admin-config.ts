export const ADMIN_EMAIL = "sashabaranov@sushii.dev";
export const ADMIN_USERNAMES = ["sushics2"] as const;

export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function isAdminUsername(username: string): boolean {
  const lower = username.toLowerCase();
  return ADMIN_USERNAMES.some((u) => u.toLowerCase() === lower);
}
