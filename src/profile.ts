/**
 * @file Загрузка профиля студента с backend API.
 */

import { apiGet, apiPost, isApiConfigured } from '@/apiClient'
import { student } from '@/mocks/student'

/** Ответ `GET /api/student/profile` */
export type StudentProfileDto = {
  fullName: string
  /** Номер зачётки */
  studentId: string
  email: string
  phone: string
  gender: string
  birthDate: string
  funding: string
  status: string
  faculty: string
  /** Филиал из 1С, напр. «Казанский кооперативный институт (филиал)…» */
  branch: string
  department: string
  direction: string
  level: string
  educationForm: string
  group: string
  course: string
}

/** Ответ `POST /api/student/email/request` */
export type RequestEmailChangeDto = {
  maskedEmail: string
  message: string
  expiresInSeconds: number
}

/** Ответ `POST /api/student/email/confirm` */
export type UpdateEmailDto = {
  email: string
  oldEmail: string
  message: string
}

/** Мок-профиль для режима без API */
export function mockStudentProfile(): StudentProfileDto {
  const program = student.programs[0]
  return {
    fullName: student.fullName,
    studentId: program?.cardNumber ?? student.studentId,
    email: student.personalEmail,
    phone: student.phone,
    gender: student.gender,
    birthDate: student.birthDate,
    funding: student.funding,
    status: program?.status ?? '',
    faculty: program?.faculty ?? '',
    branch: '',
    department: program?.department ?? '',
    direction: program?.direction ?? '',
    level: program?.level ?? '',
    educationForm: program?.form ?? '',
    group: program?.group ?? '',
    course: String(program?.course ?? ''),
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

/**
 * Отправить код подтверждения на новую почту.
 */
export async function requestEmailChange(email: string): Promise<RequestEmailChangeDto> {
  return apiPost<RequestEmailChangeDto>('/api/student/email/request', { email })
}

/**
 * Подтвердить код и сохранить новую почту в 1С.
 */
export async function confirmEmailChange(code: string): Promise<UpdateEmailDto> {
  return apiPost<UpdateEmailDto>('/api/student/email/confirm', { code })
}
