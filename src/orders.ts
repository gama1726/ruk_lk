/**
 * @file Загрузка приказов студента с backend API (1С).
 */

import { apiGet, isApiConfigured } from '@/apiClient'

/** Строка `GET /api/student/orders` */
export type StudentOrderItemDto = {
  id: string
  title: string
  type: string
  document: string
  number: string
  orderDate: string
  displayOrderDate: string
  startDate: string
  displayStartDate: string
}

/** Ответ `GET /api/student/orders` */
export type StudentOrdersDto = {
  studentId: string
  studentFullName: string
  orders: StudentOrderItemDto[]
}

export async function fetchStudentOrders(): Promise<StudentOrdersDto> {
  return apiGet<StudentOrdersDto>('/api/student/orders')
}

export function isOrdersApiEnabled(): boolean {
  return isApiConfigured()
}
