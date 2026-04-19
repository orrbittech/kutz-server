/** Parses typical env boolean strings; returns undefined if unset or unrecognized. */
export function parseEnvBoolean(raw: string | undefined): boolean | undefined {
  if (raw === undefined || raw === '') return undefined;
  const v = raw.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return undefined;
}
