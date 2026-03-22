/**
 * Simple HMAC-like signing for OAuth signup metadata stored in localStorage.
 * Prevents trivial role/hospital_id tampering via browser DevTools.
 *
 * NOTE: This is NOT cryptographic security — localStorage is inherently
 * client-side and a determined attacker can bypass it. The real protection
 * is the server-side apply_oauth_role RPC that validates roles. This signing
 * adds defense-in-depth to detect casual tampering.
 */

// Application-embedded key — not a secret, just a tampering detection seed.
// The real authorization happens server-side via RPC.
const SIGNING_KEY = 'rob-oauth-meta-v1';

/**
 * Simple hash function (djb2 variant) — fast, deterministic, non-crypto.
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function computeSignature(data: string): string {
  return simpleHash(SIGNING_KEY + ':' + data);
}

/**
 * Sign OAuth meta and return a JSON string containing data + signature.
 */
export function signOAuthMeta(meta: { role: string; hospitalId: string | null }): string {
  const data = JSON.stringify(meta);
  const sig = computeSignature(data);
  return JSON.stringify({ data, sig });
}

/**
 * Verify signed OAuth meta. Returns parsed meta if valid, null if tampered.
 */
export function verifyOAuthMeta(raw: string): { role: string; hospitalId: string | null } | null {
  try {
    const { data, sig } = JSON.parse(raw) as { data?: string; sig?: string };
    if (!data || !sig) return null;

    const expected = computeSignature(data);
    if (sig !== expected) return null;

    return JSON.parse(data) as { role: string; hospitalId: string | null };
  } catch {
    return null;
  }
}
