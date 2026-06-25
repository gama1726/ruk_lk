const AVATAR_MALE = '/avatars/avatar-male.png'
const AVATAR_FEMALE = '/avatars/avatar-female.png'

/**
 * URL аватара студента по полю из профиля 1С («мужской» / «женский»).
 */
export function isFemaleGender(gender: string | null | undefined): boolean {
  const normalized = (gender ?? '').trim().toLowerCase()
  return normalized.startsWith('ж') || normalized.includes('жен')
}

export function studentAvatarSrc(gender: string | null | undefined): string {
  if (isFemaleGender(gender)) {
    return AVATAR_FEMALE
  }
  return AVATAR_MALE
}
