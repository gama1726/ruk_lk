/**
 * @file Признаки кампуса: головной вуз, филиалы, ZKBio (Казань ККИ).
 */

/** Подразделение относится к филиалу (не головной кампус). */
export function isBranchCampus(...parts: Array<string | null | undefined>): boolean {
  return parts.some((part) => {
    if (!part) return false
    return part.toLocaleLowerCase('ru-RU').includes('филиал')
  })
}

/** Казанский филиал ККИ — посещаемость через ZKBio. */
export function isKazanKkiCampus(...parts: Array<string | null | undefined>): boolean {
  if (!isBranchCampus(...parts)) return false
  const haystack = parts
    .filter((p): p is string => Boolean(p?.trim()))
    .join(' ')
    .toLocaleLowerCase('ru-RU')
  return (
    haystack.includes('казан') &&
    (haystack.includes('кки') || haystack.includes('kci') || haystack.includes('кооператив'))
  )
}

/**
 * Раздел «Посещаемость»: головной вуз (Perco) или Казань ККИ (ZKBio).
 * Пока профиль не загружен — не скрываем пункт.
 */
export function isAttendanceNavVisible(profile: {
  faculty?: string
  department?: string
  branch?: string
} | null): boolean {
  if (!profile) return true
  const parts = [profile.faculty, profile.department, profile.branch]
  if (!isBranchCampus(...parts)) return true
  return isKazanKkiCampus(...parts)
}
