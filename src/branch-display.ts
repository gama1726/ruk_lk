/**
 * @file Отображение филиала: короткое название, герб, подписи для плашки профиля.
 */

import type { BranchBannerProps } from '@/ui/BranchBanner/BranchBanner'
import { resolveUniversityBranch, type UniversityBranch } from '@/mocks/university-contacts'

export const universityLegalName = 'Российский университет кооперации'

const branchDisplayById: Readonly<
  Record<string, { shortTitle: string; studentBadge: string }>
> = {
  main: { shortTitle: 'Головной вуз — Мытищи', studentBadge: 'Головной вуз' },
  kazan: { shortTitle: 'Казань', studentBadge: 'Казань' },
  krasnodar: { shortTitle: 'Краснодар', studentBadge: 'Краснодар' },
  vladimir: { shortTitle: 'Владимир', studentBadge: 'Владимир' },
  arzamas: { shortTitle: 'Арзамас', studentBadge: 'Арзамас' },
  ufa: { shortTitle: 'Уфа', studentBadge: 'Уфа' },
  volgograd: { shortTitle: 'Волгоград', studentBadge: 'Волгоград' },
  izhevsk: { shortTitle: 'Ижевск', studentBadge: 'Ижевск' },
  kaliningrad: { shortTitle: 'Калининград', studentBadge: 'Калининград' },
  pk: { shortTitle: 'Петропавловск-Камчатский', studentBadge: 'Камчатка' },
  crimea: { shortTitle: 'Крым', studentBadge: 'Крым' },
  engels: { shortTitle: 'Энгельс', studentBadge: 'Энгельс' },
  saransk: { shortTitle: 'Саранск', studentBadge: 'Саранск' },
  smolensk: { shortTitle: 'Смоленск', studentBadge: 'Смоленск' },
  cheb: { shortTitle: 'Чебоксары', studentBadge: 'Чебоксары' },
}

/** Имена файлов гербов в public/branches/ (по умолчанию {id}.png). */
const branchCrestFiles: Partial<Record<string, string>> = {
  main: 'main.jpg',
  kazan: 'kazan.jpg',
}

export type BranchDisplayInfo = {
  branch: UniversityBranch
  shortTitle: string
  studentBadge: string
  crestSrc: string
  isMain: boolean
}

export function branchCrestSrc(branchId: string): string {
  const file = branchCrestFiles[branchId] ?? `${branchId}.png`
  return `/branches/${file}`
}

export function getBranchDisplayInfo(branchLabel?: string | null): BranchDisplayInfo {
  const branch = resolveUniversityBranch(branchLabel)
  const display = branchDisplayById[branch.id] ?? branchDisplayById.main

  return {
    branch,
    shortTitle: display.shortTitle,
    studentBadge: display.studentBadge,
    crestSrc: branchCrestSrc(branch.id),
    isMain: branch.id === 'main',
  }
}

export function branchBannerProps(
  branchLabel: string | null | undefined,
  variant: 'parent' | 'student',
): BranchBannerProps {
  const info = getBranchDisplayInfo(branchLabel)

  return {
    label: variant === 'parent' ? 'Филиал обучения студента' : 'Ваш филиал',
    title: info.shortTitle,
    subtitle: universityLegalName,
    badge: 'Текущий филиал',
    emblemSrc: info.crestSrc,
  }
}
