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

export { formatShortDate, rub }
