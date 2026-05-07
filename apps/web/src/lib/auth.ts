// SEC-02: JWT is stored in an httpOnly cookie set by the API server.
// This module tracks login state via a plain (non-httpOnly) "ww_authed" cookie
// that is readable by JS for UI gating only. The actual auth token is never
// accessible to JavaScript, preventing XSS-based token theft.

const AUTHED_COOKIE = 'ww_authed';

export function isLoggedIn(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${AUTHED_COOKIE}=`));
}

export function setLoggedIn(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTHED_COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearLoggedIn(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTHED_COOKIE}=; path=/; max-age=0`;
}
