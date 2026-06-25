/**
 * @file Загрузка профиля студента с backend API.
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import { student } from '@/mocks/student'

/** Ответ `GET /api/student/profile` */
export type StudentProfileDto = {
  fullName: string
  studentId: string
  corporateEmail: string
  personalEmail: string
  phone: string
  gender: string
  birthDate: string
  funding: string
  status: string
}

/** Мок-профиль для режима без API */
export function mockStudentProfile(): StudentProfileDto {
  return {
    fullName: student.fullName,
    studentId: student.studentId,
    corporateEmail: student.corporateEmail,
    personalEmail: student.personalEmail,
    phone: student.phone,
    gender: student.gender,
    birthDate: student.birthDate,
    funding: student.funding,
    status: student.programs[0]?.status ?? '',
  }
}

/**
 * Загружает профиль из API или возвращает мок.
 * @throws {@link ApiError} при ошибке HTTP (только если API настроен)
 */
export async function fetchStudentProfile(): Promise<StudentProfileDto> {
  if (!isApiConfigured()) {
    return mockStudentProfile()
  }
  return apiGet<StudentProfileDto>('/api/student/profile')
}
