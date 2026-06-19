/**
 * @file Оплата обучения (мок).
 * @remarks Привязана к аккаунту, не к конкретной программе.
 */

export type PaymentSummary = {
  contractLabel: string
  paidPercent: number
  balance: number
  nextDate: string
  nextAmount: number
  status: 'ok' | 'due' | 'overdue'
}

/** Сводка для виджета на главной */
export const paymentSummary: PaymentSummary = {
  contractLabel: 'Договор на обучение · 2023/24–2026/27',
  paidPercent: 72,
  balance: 48_500,
  nextDate: '2026-06-25',
  nextAmount: 24_250,
  status: 'due',
}

/**
 * Форматирует сумму в рублях для интерфейса.
 * @param amount - число в рублях
 */
export function rub(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Дата для подписи «до 25 июня».
 * @param iso - `YYYY-MM-DD`
 */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(iso))
}
