/**
 * @file Конфигурация филиалов для плашки BranchBanner и связанных блоков.
 * Названия — как на сайтах филиалов new.ruc.su / new-*.ruc.su.
 */

import { resolveUniversityBranch, universityBranches } from '@/mocks/university-contacts'

export const universityLegalName = 'Российский университет кооперации'

export type BranchType = 'head' | 'branch' | 'institute'

export type Branch = {
  /** Город / местонахождение (подпись над названием). */
  city: string
  /** Название как на сайте филиала. */
  name: string
  universityName: string
  badge?: string
  type?: BranchType
}

type BranchConfigEntry = {
  city: string
  /** Если не задано — берётся name из universityBranches. */
  name?: string
  type: BranchType
}

/** Конфигурация филиалов по id (сопоставляется с resolveUniversityBranch). */
const branchConfigs: Readonly<Record<string, BranchConfigEntry>> = {
  main: {
    city: 'Мытищи',
    name: 'Головной вуз',
    type: 'head',
  },
  kazan: {
    city: 'Казань',
    type: 'institute',
  },
  krasnodar: {
    city: 'Краснодар',
    type: 'institute',
  },
  vladimir: {
    city: 'Владимир',
    type: 'branch',
  },
  arzamas: {
    city: 'Арзамас',
    type: 'branch',
  },
  ufa: {
    city: 'Уфа',
    type: 'institute',
  },
  volgograd: {
    city: 'Волгоград',
    type: 'institute',
  },
  izhevsk: {
    city: 'Ижевск',
    type: 'branch',
  },
  kaliningrad: {
    city: 'Калининград',
    type: 'branch',
  },
  pk: {
    city: 'Петропавловск-Камчатский',
    type: 'branch',
  },
  crimea: {
    city: 'Крым',
    type: 'institute',
  },
  engels: {
    city: 'Энгельс',
    type: 'institute',
  },
  saransk: {
    city: 'Саранск',
    type: 'institute',
  },
  smolensk: {
    city: 'Смоленск',
    type: 'institute',
  },
  cheb: {
    city: 'Чебоксары',
    type: 'institute',
  },
}

const branchSiteNameById = Object.fromEntries(
  universityBranches.map((branch) => [branch.id, branch.name]),
) as Record<string, string>

/** Собирает объект Branch по строке branch из профиля студента (1С). */
export function resolveBranch(branchLabel?: string | null): Branch {
  const resolved = resolveUniversityBranch(branchLabel)
  const config = branchConfigs[resolved.id] ?? branchConfigs.main
  const siteName = branchSiteNameById[resolved.id] ?? branchSiteNameById.main

  return {
    city: config.city,
    name: config.name ?? siteName,
    universityName: universityLegalName,
    type: config.type,
  }
}
