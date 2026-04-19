/** Clerk session/JWT claims that indicate staff admin (session token customization + org roles). */
const ADMIN_ROLE_VALUES = new Set(['admin', 'org:admin']);

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function isAdminRoleString(value: string): boolean {
  return ADMIN_ROLE_VALUES.has(value.trim().toLowerCase());
}

function roleFromRecord(rec: Record<string, unknown>): boolean {
  const role = readString(rec, 'role');
  if (role && isAdminRoleString(role)) return true;
  return false;
}

/**
 * True when the verified Clerk JWT payload carries an admin role (custom session claims or metadata).
 */
export function jwtIndicatesClerkAdmin(payload: unknown): boolean {
  if (payload === null || typeof payload !== 'object') return false;
  const o = payload as Record<string, unknown>;
  if (roleFromRecord(o)) return true;
  const orgRole = readString(o, 'org_role');
  if (orgRole && isAdminRoleString(orgRole)) return true;

  for (const key of ['metadata', 'public_metadata', 'publicMetadata']) {
    const nested = o[key];
    if (nested !== null && typeof nested === 'object') {
      if (roleFromRecord(nested as Record<string, unknown>)) return true;
    }
  }
  return false;
}

function parseAdminAllowlist(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Admin if the user id is in ADMIN_CLERK_USER_IDS or the JWT indicates admin (Clerk role / metadata).
 */
export function isAdminClerkUser(
  clerkUserId: string,
  jwtPayload: unknown,
  adminClerkUserIdsCsv: string | undefined,
): boolean {
  if (parseAdminAllowlist(adminClerkUserIdsCsv).includes(clerkUserId)) return true;
  return jwtIndicatesClerkAdmin(jwtPayload);
}
