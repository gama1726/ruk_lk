/**
 * @file Загрузка портфолио студента с backend API (1С).
 */

import { apiGet, isApiConfigured } from '@/apiClient'

export type StudentPortfolioItemDto = {
  id: string
  title: string
  type: string
  date: string
  displayDate: string
  status: string
  document: string
  description: string
}

export type StudentPortfolioDto = {
  studentId: string
  studentFullName: string
  portfolioFound: boolean
  count: number
  items: StudentPortfolioItemDto[]
}

export async function fetchStudentPortfolio(): Promise<StudentPortfolioDto> {
  return apiGet<StudentPortfolioDto>('/api/student/portfolio')
}

export function isPortfolioApiEnabled(): boolean {
  return isApiConfigured()
}
