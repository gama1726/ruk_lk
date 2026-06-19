/**
 * @file Вспомогательные форматтеры для моков и UI.
 */

import type { StudyProgram } from './types'

/**
 * Собирает подпись программы для селектора и заголовков.
 * @param program - запись об обучении
 * @returns строка вида «Уровень · Направление · Группа»
 * @example
 * programLabel(student.programs[0])
 * // → 'Бакалавриат · Информационная безопасность · ИБ-23'
 */
export function programLabel(program: StudyProgram): string {
  return `${program.level} · ${program.direction} · ${program.group}`
}

/**
 * Маскирует телефон перед выводом в кабинете.
 * @param phone - номер в любом формате
 * @returns замаскированная строка; исходник не мутируем
 * @example
 * maskPhone('+79161234567') // → '+7 (916) ***-**-67'
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    const code = digits.slice(1, 4)
    const tail = digits.slice(-2)
    return `+7 (${code}) ***-**-${tail}`
  }

  if (digits.length >= 4) {
    return `***${digits.slice(-4)}`
  }

  return '***'
}

/**
 * Достаёт имя из ФИО для приветствия на главной.
 * @param fullName - полное имя, ожидаем «Фамилия Имя Отчество»
 * @returns имя; если формат нестандартный — возвращаем что есть
 * @example
 * firstName('Иванов Артём Сергеевич') // → 'Артём'
 */
export function firstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return parts[1] ?? parts[0] ?? fullName
}

/**
 * Возраст и дата рождения для профиля.
 * @param birthDate - ISO `YYYY-MM-DD`
 */
export function ageWithBirthDate(birthDate: string): string {
  const born = new Date(birthDate)
  if (Number.isNaN(born.getTime())) return birthDate

  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const monthDiff = now.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age -= 1

  const formatted = born.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${age} ${ageWord(age)} (${formatted})`
}

function ageWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'лет'
  if (mod10 === 1) return 'год'
  if (mod10 >= 2 && mod10 <= 4) return 'года'
  return 'лет'
}

/**
 * Форматирует дату для списка уведомлений.
 * @param iso - ISO-дата или дата-время
 */
export function noticeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const hasTime = iso.includes('T') || iso.includes(':')
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(hasTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}
