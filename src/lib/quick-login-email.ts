/** localStorage key for quick-login / profile email (browser-only). */
export const UVA_QUICK_LOGIN_EMAIL_KEY = "uvaQuickLoginEmail";

export function normalizeUvaEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** UVA NetBadge / Google Workspace student email. */
export function isLikelyUvaEmail(raw: string): boolean {
  const s = normalizeUvaEmail(raw);
  if (!s.includes("@")) return false;
  return s.endsWith("@virginia.edu");
}
