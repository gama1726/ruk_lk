/**
 * @file Признаки кампуса: головной вуз, филиалы.
 */

/** Подразделение относится к филиалу (не головной кампус). */
export function isBranchCampus(...parts: Array<string | null | undefined>): boolean {
  return parts.some((part) => {
    if (!part) return false
    return part.toLocaleLowerCase('ru-RU').includes('филиал')
  })
}

type CampusProfile = {
  faculty?: string
  department?: string
  branch?: string
  group?: string
}

/**
 * Раздел «Посещаемость» в навигации.
 * Глобальный флаг — {@code app.attendance.enabled} через {@link useAppFeatures}.
 * Технически СКУД есть только у головы и Казани.
 */
export function isAttendanceNavVisible(
  profile: CampusProfile | null,
  featureEnabled: boolean,
): boolean {
  if (!featureEnabled) return false
  if (!profile) return true
  return resolveEventCampus(profile) !== null
}

function isHeadCampus(profile: CampusProfile | null): boolean {
  if (!profile) return true
  return !isBranchCampus(profile.faculty, profile.department, profile.branch)
}

/**
 * «Фото для пропуска»: только головной кампус (загрузка в Perco).
 * Пока профиль не загружен — не скрываем пункт.
 */
export function isPassPhotoNavVisible(profile: CampusProfile | null): boolean {
  return isHeadCampus(profile)
}

/** Кампусы календаря мероприятий (админка и кабинеты). */
export type EventCampusId = 'HEAD' | 'KAZAN'

const KAZAN_GROUP_CODE = /кз\d{2}/i

/**
 * Кампус календаря по профилю 1С: Головной / Казань / null (другие филиалы).
 * Совпадает с логикой backend `EventCampusResolver`.
 */
export function resolveEventCampus(profile: {
  faculty?: string
  department?: string
  branch?: string
  group?: string
} | null): EventCampusId | null {
  if (!profile) return 'HEAD'
  const haystack = [profile.branch, profile.faculty, profile.department, profile.group]
    .filter((p): p is string => Boolean(p?.trim()))
    .join(' ')
    .toLocaleLowerCase('ru-RU')
  if (haystack.includes('казан') || haystack.includes('/кз') || KAZAN_GROUP_CODE.test(haystack)) {
    return 'KAZAN'
  }
  if (haystack.includes('филиал')) return null
  return 'HEAD'
}

/** Подпись кампуса в админке и календаре. */
export function eventCampusLabel(campus: EventCampusId | string): string {
  if (campus === 'KAZAN') return 'Казань'
  return 'Головной'
}

/**
 * Раздел «Мероприятия»: только головной вуз и Казань.
 * Пока профиль не загружен — не скрываем пункт.
 */
export function isEventsNavVisible(profile: {
  faculty?: string
  department?: string
  branch?: string
  group?: string
} | null): boolean {
  if (!profile) return true
  return resolveEventCampus(profile) !== null
}
