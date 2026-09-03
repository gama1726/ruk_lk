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
  emblem: string
  badge?: string
  type?: BranchType
}

type BranchConfigEntry = {
  city: string
  /** Если не задано — берётся name из universityBranches. */
  name?: string
  emblemFile: string
  type: BranchType
}

/** Конфигурация филиалов по id (сопоставляется с resolveUniversityBranch). */
const branchConfigs: Readonly<Record<string, BranchConfigEntry>> = {
  main: {
    city: 'Мытищи',
    name: 'Головной вуз',
    emblemFile: 'main.png',
    type: 'head',
  },
  kazan: {
    city: 'Казань',
    emblemFile: 'kazan.png',
    type: 'institute',
  },
  krasnodar: {
    city: 'Краснодар',
    emblemFile: 'krasnodar.png',
    type: 'institute',
  },
  vladimir: {
    city: 'Владимир',
    emblemFile: 'vladimir.png',
    type: 'branch',
  },
  arzamas: {
    city: 'Арзамас',
    emblemFile: 'arzamas.png',
    type: 'branch',
  },
  ufa: {
    city: 'Уфа',
    emblemFile: 'ufa.png',
    type: 'institute',
  },
  volgograd: {
    city: 'Волгоград',
    emblemFile: 'volgograd.png',
    type: 'institute',
  },
  izhevsk: {
    city: 'Ижевск',
    emblemFile: 'izhevsk.png',
    type: 'branch',
  },
  kaliningrad: {
    city: 'Калининград',
    emblemFile: 'kaliningrad.png',
    type: 'branch',
  },
  pk: {
    city: 'Петропавловск-Камчатский',
    emblemFile: 'pk.png',
    type: 'branch',
  },
  crimea: {
    city: 'Крым',
    emblemFile: 'crimea.png',
    type: 'institute',
  },
  engels: {
    city: 'Энгельс',
    emblemFile: 'engels.png',
    type: 'institute',
  },
  saransk: {
    city: 'Саранск',
    emblemFile: 'saransk.png',
    type: 'institute',
  },
  smolensk: {
    city: 'Смоленск',
    emblemFile: 'smolensk.png',
    type: 'institute',
  },
  cheb: {
    city: 'Чебоксары',
    emblemFile: 'cheb.png',
    type: 'institute',
  },
}

const branchSiteNameById = Object.fromEntries(
  universityBranches.map((branch) => [branch.id, branch.name]),
) as Record<string, string>

export function branchEmblemSrc(emblemFile: string): string {
  return `/branches/${emblemFile}`
}

/** Собирает объект Branch по строке branch из профиля студента (1С). */
export function resolveBranch(branchLabel?: string | null): Branch {
  const resolved = resolveUniversityBranch(branchLabel)
  const config = branchConfigs[resolved.id] ?? branchConfigs.main
  const siteName = branchSiteNameById[resolved.id] ?? branchSiteNameById.main

  return {
    city: config.city,
    name: config.name ?? siteName,
    universityName: universityLegalName,
    emblem: branchEmblemSrc(config.emblemFile),
    type: config.type,
  }
}
