/**
 * @file Оплата обучения (мок).
 * @remarks Привязана к аккаунту, не к конкретной программе.
 */

export type PaymentSummary = {
  contractLabel: string
  contractNumber: string
  paidPercent: number
  balance: number
  nextDate: string
  nextAmount: number
  status: 'ok' | 'due' | 'overdue'
}

export type Charge = {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'paid' | 'pending' | 'overdue'
}

export type PaymentRecord = {
  id: string
  date: string
  amount: number
  method: string
}

/** Сводка для виджета и страницы оплаты */
export const paymentSummary: PaymentSummary = {
  contractLabel: 'Договор на обучение · 2023/24–2026/27',
  contractNumber: 'ДГ-2023/0142-ИБ',
  paidPercent: 72,
  balance: 48_500,
  nextDate: '2026-06-25',
  nextAmount: 24_250,
  status: 'due',
}

export const charges: Charge[] = [
  { id: 'c1', title: 'Оплата за 2 семестр 2025/26', amount: 24_250, dueDate: '2026-06-25', status: 'pending' },
  { id: 'c2', title: 'Оплата за 1 семестр 2025/26', amount: 24_250, dueDate: '2026-02-01', status: 'paid' },
  { id: 'c3', title: 'Оплата за 2 семестр 2024/25', amount: 23_800, dueDate: '2025-06-20', status: 'paid' },
]

export const paymentHistory: PaymentRecord[] = [
  { id: 'p1', date: '2026-02-03', amount: 24_250, method: 'Банковская карта' },
  { id: 'p2', date: '2025-06-18', amount: 23_800, method: 'Банковский перевод' },
  { id: 'p3', date: '2025-02-10', amount: 23_800, method: 'Банковская карта' },
]

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
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
}

/**
 * Заглушка перехода к оплате — реальный платёж подключится через backend.
 */
export function goToPayment(): void {
  window.alert('Оплата будет доступна после подключения платёжного сервиса университета.')
}
