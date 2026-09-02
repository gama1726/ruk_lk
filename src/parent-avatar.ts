import type { ParentRelationKind } from '@/parent-auth'

const PARENT_AVATAR_FATHER = '/avatars/parent-father.jpg'
const PARENT_AVATAR_MOTHER = '/avatars/parent-mother.jpg'

/** Роль из 1С / сессии → kind для аватара и UI. */
export function parseParentRelationKind(relation: string | null | undefined): ParentRelationKind {
  const normalized = (relation ?? '').trim().toLowerCase()
  if (normalized.includes('мать')) return 'mother'
  if (normalized.includes('отец') || normalized.includes('отца')) return 'father'
  return 'guardian'
}

/** URL аватара родителя по роли (отец / мать). */
export function parentAvatarSrc(relation?: string | null): string {
  return parseParentRelationKind(relation) === 'mother' ? PARENT_AVATAR_MOTHER : PARENT_AVATAR_FATHER
}
