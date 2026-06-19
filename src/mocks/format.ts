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
