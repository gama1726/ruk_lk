/**
 * @file Маршруты приложения.
 * Ключи — для кода, значения — path в react-router.
 */

/** Карта разделов личного кабинета */
export const paths = {
  home: '/',
  login: '/login',
  verify: '/verify-code',
  profile: '/profile',
  news: '/messages',
  schedule: '/schedule',
  education: '/education',
  grades: '/grades',
  recordBook: '/record-book',
  attendance: '/attendance',
  debts: '/debts',
  studyPlan: '/study-plan',
  roadmap: '/roadmap',
  teachers: '/teachers',
  orders: '/orders',
  services: '/services',
  requests: '/requests',
  payments: '/payments',
  dormitory: '/dormitory',
  bypassList: '/bypass-list',
  psychologist: '/psychologist',
  portfolio: '/portfolio',
  library: '/library',
  settings: '/settings',
} as const
