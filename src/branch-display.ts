/**
 * @file Конфигурация филиалов для плашки BranchBanner и связанных блоков.
 */

import { resolveUniversityBranch } from '@/mocks/university-contacts'

export const universityLegalName = 'Российский университет кооперации'

export type BranchType = 'head' | 'branch' | 'institute'

export type Branch = {
  name: string
  universityName: string
  emblem: string
  badge?: string
  type?: BranchType
}

type BranchConfigEntry = {
  name: string
  emblemFile: string
  type: BranchType
}

/** Конфигурация филиалов по id (сопоставляется с resolveUniversityBranch). */
const branchConfigs: Readonly<Record<string, BranchConfigEntry>> = {
  main: {
    name: 'Головной вуз — Мытищи',
    emblemFile: 'main.jpg',
    type: 'head',
  },
  kazan: {
    name: 'Казанский кооперативный институт',
    emblemFile: 'kazan.jpg',
    type: 'institute',
  },
  krasnodar: {
    name: 'Краснодарский кооперативный институт',
    emblemFile: 'krasnodar.jpg',
    type: 'institute',
  },
  vladimir: {
    name: 'Владимирский филиал',
    emblemFile: 'vladimir.png',
    type: 'branch',
  },
  arzamas: {
    name: 'Арзамасский филиал',
    emblemFile: 'arzamas.png',
    type: 'branch',
  },
  ufa: {
    name: 'Башкирский кооперативный институт',
    emblemFile: 'ufa.png',
    type: 'institute',
  },
  volgograd: {
    name: 'Волгоградский кооперативный институт',
    emblemFile: 'volgograd.png',
    type: 'institute',
  },
  izhevsk: {
    name: 'Ижевский филиал',
    emblemFile: 'izhevsk.png',
    type: 'branch',
  },
  kaliningrad: {
    name: 'Калининградский филиал',
    emblemFile: 'kaliningrad.png',
    type: 'branch',
  },
  pk: {
    name: 'Камчатский филиал',
    emblemFile: 'pk.png',
    type: 'branch',
  },
  crimea: {
    name: 'Крымский кооперативный институт',
    emblemFile: 'crimea.png',
    type: 'institute',
  },
  engels: {
    name: 'Поволжский кооперативный институт',
    emblemFile: 'engels.png',
    type: 'institute',
  },
  saransk: {
    name: 'Саранский кооперативный институт',
    emblemFile: 'saransk.png',
    type: 'institute',
  },
  smolensk: {
    name: 'Смоленский кооперативный институт',
    emblemFile: 'smolensk.png',
    type: 'institute',
  },
  cheb: {
    name: 'Чебоксарский кооперативный институт',
    emblemFile: 'cheb.png',
    type: 'institute',
  },
}

const defaultBadge = 'Текущий филиал'

export function branchEmblemSrc(emblemFile: string): string {
  return `/branches/${emblemFile}`
}

/** Собирает объект Branch по строке branch из профиля студента (1С). */
export function resolveBranch(branchLabel?: string | null): Branch {
  const resolved = resolveUniversityBranch(branchLabel)
  const config = branchConfigs[resolved.id] ?? branchConfigs.main

  return {
    name: config.name,
    universityName: universityLegalName,
    emblem: branchEmblemSrc(config.emblemFile),
    badge: defaultBadge,
    type: config.type,
  }
}
