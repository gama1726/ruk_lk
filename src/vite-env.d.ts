/**
 * @file Типы `import.meta.env` для Vite.
 * @see {@link https://vitejs.dev/guide/env-and-mode}
 */

interface ImportMetaEnv {
  /** Базовый URL backend API, например `https://api.ruc.local` */
  readonly VITE_API_BASE_URL?: string
  /**
   * URL OpenID Connect / Keycloak для «Войти через SSO».
   * Пусто — mock-форма на {@link paths.sso}.
   */
  readonly VITE_SSO_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
