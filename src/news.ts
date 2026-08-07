/**
 * @file Новости университета с new.ruc.su через backend.
 */

import { apiGet, isApiConfigured } from '@/apiClient'

export type StudentNewsItemDto = {
  id: string
  title: string
  preview: string
  date: string
  url: string
  imageUrl: string
}

export type StudentNewsDto = {
  status: 'ok' | 'unavailable' | string
  items: StudentNewsItemDto[]
}

export function isNewsApiEnabled(): boolean {
  return isApiConfigured()
}

export async function fetchStudentNews(): Promise<StudentNewsDto> {
  return apiGet<StudentNewsDto>('/api/student/news')
}
