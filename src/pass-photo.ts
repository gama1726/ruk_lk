/**
 * @file Клиент API «Фото для пропуска».
 */

import { apiGet, apiPost, apiPostFormData, apiPut, getApiBaseUrl, isApiConfigured } from '@/apiClient'
import type { PassPhotoIssuePayload } from '@/apiClient'

export type PassPhotoStatus =
  | 'PENDING'
  | 'REJECTED'
  | 'PERCO_SYNCING'
  | 'PERCO_SYNCED'
  | 'PERCO_FAILED'

export type EducationTrack = 'SPO' | 'HE'

export type PassPhotoSubmission = {
  id: string | null
  status: PassPhotoStatus | null
  rejectReason: string | null
  warnings: PassPhotoIssuePayload[]
  submittedAt: string | null
  reviewedAt: string | null
  percoSyncedAt: string | null
  percoError: string | null
  hasImage: boolean
  canResubmit?: boolean
  nextResubmitAt?: string | null
  /** Показывать фото пропуска как аватар в ЛК (по умолчанию false). */
  useAsAvatar?: boolean
}

export type PassPhotoAdminItem = {
  id: string
  studentId: string
  studentFullName: string
  zachetka: string
  status: PassPhotoStatus
  validationWarningsJson: string | null
  submittedAt: string
  reviewedAt: string | null
  rejectReason: string | null
  percoError: string | null
}

export type AdminMe = {
  username: string
  role: EducationTrack
}

const ADMIN_ROLE_HEADER = 'X-Admin-Role'

export function adminRoleHeaders(role: EducationTrack): HeadersInit {
  return { [ADMIN_ROLE_HEADER]: role }
}

export function passPhotoImageUrl(id: string, admin?: boolean): string {
  return admin
    ? `${getApiBaseUrl()}/api/admin/pass-photos/${id}/image`
    : `${getApiBaseUrl()}/api/student/pass-photo/${id}/image`
}

export async function fetchPassPhotoSubmission(): Promise<PassPhotoSubmission> {
  return apiGet<PassPhotoSubmission>('/api/student/pass-photo')
}

export type PassPhotoValidationResponse = {
  ok: boolean
  issues: PassPhotoIssuePayload[]
}

export async function validatePassPhoto(file: File): Promise<PassPhotoValidationResponse> {
  const form = new FormData()
  form.append('file', file)
  return apiPostFormData<PassPhotoValidationResponse>('/api/student/pass-photo/validate', form)
}

export async function uploadPassPhoto(file: File): Promise<PassPhotoSubmission> {
  const form = new FormData()
  form.append('file', file)
  return apiPostFormData<PassPhotoSubmission>('/api/student/pass-photo', form)
}

export async function setPassPhotoAsAvatar(useAsAvatar: boolean): Promise<PassPhotoSubmission> {
  return apiPut<PassPhotoSubmission>('/api/student/pass-photo/avatar-preference', { useAsAvatar })
}

export async function adminLogin(username: string, password: string): Promise<AdminMe> {
  return apiPost<AdminMe>('/api/admin/auth/login', { username, password })
}

export async function adminLogout(role: EducationTrack): Promise<void> {
  await apiPost<{ ok: string }>(`/api/admin/auth/logout?role=${role}`, {})
}

export async function fetchAdminMe(role: EducationTrack): Promise<AdminMe> {
  return apiGet<AdminMe>(`/api/admin/auth/me?role=${role}`)
}

export async function fetchAdminPassPhotoQueue(role: EducationTrack): Promise<PassPhotoAdminItem[]> {
  return apiGet<PassPhotoAdminItem[]>('/api/admin/pass-photos', {
    headers: adminRoleHeaders(role),
  })
}

export async function fetchAdminPassPhotoHistory(
  role: EducationTrack,
  limit = 30,
): Promise<PassPhotoAdminItem[]> {
  return apiGet<PassPhotoAdminItem[]>(`/api/admin/pass-photos/history?limit=${limit}`, {
    headers: adminRoleHeaders(role),
  })
}

export async function approvePassPhoto(role: EducationTrack, id: string): Promise<PassPhotoSubmission> {
  return apiPost<PassPhotoSubmission>(
    `/api/admin/pass-photos/${id}/approve`,
    {},
    { headers: adminRoleHeaders(role) },
  )
}

export async function rejectPassPhoto(
  role: EducationTrack,
  id: string,
  reason: string,
): Promise<PassPhotoSubmission> {
  return apiPost<PassPhotoSubmission>(
    `/api/admin/pass-photos/${id}/reject`,
    { reason },
    { headers: adminRoleHeaders(role) },
  )
}

export async function retryPassPhotoPerco(
  role: EducationTrack,
  id: string,
): Promise<PassPhotoSubmission> {
  return apiPost<PassPhotoSubmission>(
    `/api/admin/pass-photos/${id}/retry-perco`,
    {},
    { headers: adminRoleHeaders(role) },
  )
}

export async function revertPassPhoto(role: EducationTrack, id: string): Promise<void> {
  await apiPost<{ ok: string }>(
    `/api/admin/pass-photos/${id}/revert`,
    {},
    { headers: adminRoleHeaders(role) },
  )
}

export function isPassPhotoApiEnabled(): boolean {
  return isApiConfigured()
}

export const passPhotoStatusLabel: Record<PassPhotoStatus, string> = {
  PENDING: 'На проверке',
  REJECTED: 'Отклонено',
  PERCO_SYNCING: 'Загрузка в систему пропуска…',
  PERCO_SYNCED: 'Принято',
  PERCO_FAILED: 'Ошибка загрузки в Perco',
}

export const educationTrackLabel: Record<EducationTrack, string> = {
  SPO: 'СПО',
  HE: 'Высшее образование',
}
