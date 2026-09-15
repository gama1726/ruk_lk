/**
 * @file Возврат после входа (например на Start).
 * Храним относительный путь в sessionStorage на время шагов логина.
 */

const STORAGE_KEY = 'ruk_lk_login_next'
const GOING_KEY = 'ruk_lk_login_going'

/** Только пути нашего origin: `/…`, без `//` и схем. */
export function isSafeLoginReturnPath(path: string | null | undefined): path is string {
  if (!path) return false
  const value = path.trim()
  if (!value.startsWith('/')) return false
  if (value.startsWith('//')) return false
  if (value.includes('://')) return false
  if (value.includes('\\')) return false
  return true
}

export function rememberLoginReturn(path: string | null | undefined): void {
  if (!isSafeLoginReturnPath(path)) return
  try {
    sessionStorage.removeItem(GOING_KEY)
    sessionStorage.setItem(STORAGE_KEY, path.trim())
  } catch {
    // private mode / quota — просто идём в профиль
  }
}

function takeLoginReturn(fallback: string): string {
  try {
    const going = sessionStorage.getItem(GOING_KEY)
    if (going && isSafeLoginReturnPath(going)) {
      return going.trim()
    }
    const next = sessionStorage.getItem(STORAGE_KEY)
    const target = isSafeLoginReturnPath(next) ? next.trim() : fallback
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.setItem(GOING_KEY, target)
    return target
  } catch {
    return fallback
  }
}

export function clearLoginReturn(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(GOING_KEY)
  } catch {
    // ignore
  }
}

/**
 * Уводит после успешного входа.
 * location.replace + going-флаг — устойчиво к двойному mount в Strict Mode.
 */
export function goAfterLogin(
  _navigate: (to: string, opts?: { replace?: boolean }) => void,
  fallback = '/profile',
): void {
  const target = takeLoginReturn(fallback)
  window.location.replace(target)
}
