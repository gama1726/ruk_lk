/**
 * @file SSO-редирект (Keycloak / OpenID Connect).
 * @remarks При пустом {@link import.meta.env.VITE_SSO_URL} используется mock-страница в приложении.
 * @see {@link paths.sso}
 */

/**
 * URL внешнего провайдера SSO, если задан в `.env`.
 * @returns полный URL или `null` для mock-режима
 * @example
 * // .env: VITE_SSO_URL=https://sso.ruc.local/realms/ruk/protocol/openid-connect/auth?...
 * ssoRedirectUrl() // → строка из env
 */
export function ssoRedirectUrl(): string | null {
  const url = import.meta.env.VITE_SSO_URL?.trim()
  return url || null
}

/**
 * Перенаправляет браузер на SSO или возвращает `false`, если нужен mock.
 * @returns `true`, если редирект выполнен
 */
export function redirectToSso(): boolean {
  const url = ssoRedirectUrl()
  if (!url) return false
  window.location.assign(url)
  return true
}
