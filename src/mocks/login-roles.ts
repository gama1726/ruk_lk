/**
 * @file Другие роли на экране входа (родитель, договор, преподаватель…).
 */

import { paths } from '@/paths'

export type LoginRoleLink = {
  to: string
  label: string
}

/** Ссылки с главной страницы входа */
export const loginRoleLinks: LoginRoleLink[] = [
  { to: paths.loginParent, label: 'Вход для родителя' },
  { to: paths.loginContract, label: 'Вход для владельца договора' },
  { to: paths.loginTarget, label: 'Вход для заказчиков целевого обучения' },
  { to: paths.loginTeacher, label: 'Вход для преподавателя' },
]

/**
 * @param email - адрес из формы
 * @returns текст ошибки или `null`
 */
export function checkEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Укажите почту'
  if (!trimmed.includes('@')) return 'Похоже, почта указана с ошибкой'
  return null
}

/**
 * @param inn - ИНН организации
 * @returns текст ошибки или `null`
 */
export function checkInn(inn: string): string | null {
  const digits = inn.replace(/\D/g, '')
  if (digits.length !== 10 && digits.length !== 12) return 'ИНН — 10 или 12 цифр'
  return null
}
