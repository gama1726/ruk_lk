/**
 * @file Отображение филиала: короткое название, герб, подписи для плашки профиля.
 */

import mainCrest from '@/assets/ruk-logo.png'
import { resolveUniversityBranch, type UniversityBranch } from '@/mocks/university-contacts'

export const universityLegalName = 'Российский университет кооперации'

const branchDisplayById: Readonly<
  Record<string, { shortTitle: string; studentBadge: string; crestInitials: string }>
> = {
  main: { shortTitle: 'Головной вуз — Мытищи', studentBadge: 'Головной вуз', crestInitials: 'РУК' },
  kazan: { shortTitle: 'Казань', studentBadge: 'Казань', crestInitials: 'ККИ' },
  krasnodar: { shortTitle: 'Краснодар', studentBadge: 'Краснодар', crestInitials: 'ККИ' },
  vladimir: { shortTitle: 'Владимир', studentBadge: 'Владимир', crestInitials: 'ВФ' },
  arzamas: { shortTitle: 'Арзамас', studentBadge: 'Арзамас', crestInitials: 'АФ' },
  ufa: { shortTitle: 'Уфа', studentBadge: 'Уфа', crestInitials: 'БКИ' },
  volgograd: { shortTitle: 'Волгоград', studentBadge: 'Волгоград', crestInitials: 'ВКИ' },
  izhevsk: { shortTitle: 'Ижевск', studentBadge: 'Ижевск', crestInitials: 'ИФ' },
  kaliningrad: { shortTitle: 'Калининград', studentBadge: 'Калининград', crestInitials: 'КФ' },
  pk: { shortTitle: 'Петропавловск-Камчатский', studentBadge: 'Камчатка', crestInitials: 'ПК' },
  crimea: { shortTitle: 'Крым', studentBadge: 'Крым', crestInitials: 'ККИ' },
  engels: { shortTitle: 'Энгельс', studentBadge: 'Энгельс', crestInitials: 'ПКИ' },
  saransk: { shortTitle: 'Саранск', studentBadge: 'Саранск', crestInitials: 'СКИ' },
  smolensk: { shortTitle: 'Смоленск', studentBadge: 'Смоленск', crestInitials: 'СКИ' },
  cheb: { shortTitle: 'Чебоксары', studentBadge: 'Чебоксары', crestInitials: 'ЧКИ' },
}

/** Имена файлов гербов в public/branches/ (по умолчанию {id}.png). */
const branchCrestFiles: Partial<Record<string, string>> = {
  kazan: 'kazan.jpg',
}

export type BranchDisplayInfo = {
  branch: UniversityBranch
  shortTitle: string
  studentBadge: string
  parentBadge: string
  crestSrc: string
  crestInitials: string
  isMain: boolean
}

export function branchCrestSrc(branchId: string): string {
  if (branchId === 'main') return mainCrest
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
    parentBadge: 'Текущий филиал',
    crestSrc: branchCrestSrc(branch.id),
    crestInitials: display.crestInitials,
    isMain: branch.id === 'main',
  }
}
