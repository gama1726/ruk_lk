/**
 * @file Отображение филиала: короткое название, герб, подписи для плашки профиля.
 */

import { resolveUniversityBranch, type UniversityBranch } from '@/mocks/university-contacts'

export const universityLegalName = 'Российский университет кооперации'

const branchDisplayById: Readonly<
  Record<
    string,
    {
      shortTitle: string
      studentBadge: string
      crestInitials: string
      crestScale: number
      crestPosition: string
    }
  >
> = {
  main: {
    shortTitle: 'Головной вуз — Мытищи',
    studentBadge: 'Головной вуз',
    crestInitials: 'РУК',
    crestScale: 1.34,
    crestPosition: '50% 46%',
  },
  kazan: {
    shortTitle: 'Казань',
    studentBadge: 'Казань',
    crestInitials: 'ККИ',
    crestScale: 1.22,
    crestPosition: '50% 42%',
  },
  krasnodar: {
    shortTitle: 'Краснодар',
    studentBadge: 'Краснодар',
    crestInitials: 'ККИ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  vladimir: {
    shortTitle: 'Владимир',
    studentBadge: 'Владимир',
    crestInitials: 'ВФ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  arzamas: {
    shortTitle: 'Арзамас',
    studentBadge: 'Арзамас',
    crestInitials: 'АФ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  ufa: {
    shortTitle: 'Уфа',
    studentBadge: 'Уфа',
    crestInitials: 'БКИ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  volgograd: {
    shortTitle: 'Волгоград',
    studentBadge: 'Волгоград',
    crestInitials: 'ВКИ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  izhevsk: {
    shortTitle: 'Ижевск',
    studentBadge: 'Ижевск',
    crestInitials: 'ИФ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  kaliningrad: {
    shortTitle: 'Калининград',
    studentBadge: 'Калининград',
    crestInitials: 'КФ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  pk: {
    shortTitle: 'Петропавловск-Камчатский',
    studentBadge: 'Камчатка',
    crestInitials: 'ПК',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  crimea: {
    shortTitle: 'Крым',
    studentBadge: 'Крым',
    crestInitials: 'ККИ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  engels: {
    shortTitle: 'Энгельс',
    studentBadge: 'Энгельс',
    crestInitials: 'ПКИ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  saransk: {
    shortTitle: 'Саранск',
    studentBadge: 'Саранск',
    crestInitials: 'СКИ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  smolensk: {
    shortTitle: 'Смоленск',
    studentBadge: 'Смоленск',
    crestInitials: 'СКИ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
  cheb: {
    shortTitle: 'Чебоксары',
    studentBadge: 'Чебоксары',
    crestInitials: 'ЧКИ',
    crestScale: 1.28,
    crestPosition: '50% 44%',
  },
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
  parentBadge: string
  crestSrc: string
  crestInitials: string
  crestScale: number
  crestPosition: string
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
    parentBadge: 'Текущий филиал',
    crestSrc: branchCrestSrc(branch.id),
    crestInitials: display.crestInitials,
    crestScale: display.crestScale,
    crestPosition: display.crestPosition,
    isMain: branch.id === 'main',
  }
}
