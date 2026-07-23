/**
 * @file Загрузка оплаты обучения с backend API (1С).
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import { formatShortDate, rub } from '@/mocks/payment'

export type PaymentOverallStatus = 'ok' | 'due' | 'overdue'
export type PaymentItemStatus = 'paid' | 'pending' | 'overdue'

export type StudentPaymentContractDto = {
  number: string
  date: string
  displayDate: string
  label: string
  objectType: string
}

export type StudentPaymentTotalsDto = {
  scheduled: number
  scheduledDue: number
  paid: number
  debt: number
  advance: number
  penalty: number
  totalToPay: number
  paidPercent: number
}

export type StudentPaymentScheduleItemDto = {
  id: string
  number: number
  title: string
  studyYear: string
  course: string
  date: string
  displayDate: string
  scheduled: number
  paid: number
  debt: number
  penalty: number
  total: number
  debtDays: number
  status: PaymentItemStatus | string
}

export type StudentPaymentsDto = {
  studentId: string
  studentFullName: string
  paymentFound: boolean
  asOfDate: string
  status: PaymentOverallStatus | string
  contract: StudentPaymentContractDto | null
  totals: StudentPaymentTotalsDto
  nextDate: string
  nextDisplayDate: string
  nextAmount: number
  schedule: StudentPaymentScheduleItemDto[]
}

export async function fetchStudentPayments(date?: string): Promise<StudentPaymentsDto> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  return apiGet<StudentPaymentsDto>(`/api/student/payments${query}`)
}

export function isPaymentsApiEnabled(): boolean {
  return isApiConfigured()
}

/** Сумма с копейками при необходимости. */
export function rubMoney(amount: number): string {
  const fraction = Math.abs(amount % 1) > 0.001 ? 2 : 0
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  }).format(amount)
}

/** Минимальная сумма на pay.ruc.su */
export const PAY_MIN_AMOUNT = 5

const PAY_BASE = 'https://pay.ruc.su/payqr/'

/**
 * Ссылка на сервис оплаты РУК.
 * @param contract - номер договора (как в 1С)
 * @param amount - сумма в рублях
 * @param returnUrl - куда вернуться после оплаты
 */
export function buildPayUrl(
  contract: string,
  amount: number,
  returnUrl = 'https://my.ruc.su/payments',
): string {
  const params = new URLSearchParams({
    contract: contract.trim(),
    summa: String(Math.round(amount * 100) / 100),
    returnUrl,
  })
  return `${PAY_BASE}?${params.toString()}`
}

/**
 * Открывает pay.ruc.su в новой вкладке.
 * @returns сообщение об ошибке или null
 */
export function openPayGateway(contract: string | null | undefined, amount: number): string | null {
  const number = contract?.trim() ?? ''
  if (!number) {
    return 'Нет номера договора для оплаты'
  }
  if (!Number.isFinite(amount) || amount < PAY_MIN_AMOUNT) {
    return `Укажите сумму не меньше ${PAY_MIN_AMOUNT} ₽`
  }
  window.open(buildPayUrl(number, amount), '_blank', 'noopener,noreferrer')
  return null
}

export { formatShortDate, rub }
