/**
 * Allowed UVA email domains for sign-in (students, faculty, staff).
 * Adjust in Supabase or here if your population uses another subdomain.
 */
const ALLOWED_DOMAINS = new Set(["virginia.edu", "email.virginia.edu"]);

export function isAllowedUvaEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  const local = email.slice(0, at);
  if (!local || local.includes(" ") || local.includes("@")) return false;
  const domain = email.slice(at + 1);
  return ALLOWED_DOMAINS.has(domain);
}

export function uvaEmailHint(): string {
  return "Use your @virginia.edu or @email.virginia.edu address.";
}
