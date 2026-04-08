/**
 * Supabase email+password provider requires an email-shaped identifier.
 * We store `username@uvasage.invalid` (RFC 2606 reserved) — users only see usernames in the UI.
 */
export const SAGE_AUTH_EMAIL_HOST = "uvasage.invalid";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Allowed: lowercase letters, digits, underscore; 3–32 chars. */
export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < 3) return "Username must be at least 3 characters.";
  if (u.length > 32) return "Username must be at most 32 characters.";
  if (!/^[a-z0-9_]+$/.test(u)) return "Username can use lowercase letters, numbers, and underscores only.";
  return null;
}

export function usernameToAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${SAGE_AUTH_EMAIL_HOST}`;
}

export function isSageSyntheticAuthEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${SAGE_AUTH_EMAIL_HOST}`);
}

export function displayAccountLabel(
  email: string | null | undefined,
  usernameMeta?: string | null | undefined
): string {
  const meta = usernameMeta?.trim();
  if (meta) return meta;
  if (email && isSageSyntheticAuthEmail(email)) {
    return email.trim().toLowerCase().slice(0, email.indexOf("@"));
  }
  return email?.trim() ?? "";
}
