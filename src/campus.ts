/**
 * @file Признаки кампуса: головной вуз vs филиал.
 */

/** Подразделение относится к филиалу (не головной кампус). */
export function isBranchCampus(...parts: Array<string | null | undefined>): boolean {
  return parts.some((part) => {
    if (!part) return false
    return part.toLocaleLowerCase('ru-RU').includes('филиал')
  })
}

/**
 * Посещаемость (Perco головного вуза) доступна только не-филиалам.
 * Пока профиль не загружен — не скрываем пункт (чтобы не мигать у головных).
 */
export function isAttendanceNavVisible(profile: {
  faculty?: string
  department?: string
} | null): boolean {
  if (!profile) return true
  return !isBranchCampus(profile.faculty, profile.department)
}
