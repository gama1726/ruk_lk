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

export function passPhotoImageUrl(id: string, adminToken?: string): string {
  const base = adminToken
    ? `${getApiBaseUrl()}/api/admin/pass-photos/${id}/image`
    : `${getApiBaseUrl()}/api/student/pass-photo/${id}/image`
  return base
}

export function adminPassPhotoHeaders(token: string): HeadersInit {
  return { 'X-Admin-Token': token }
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

export async function fetchAdminPassPhotoQueue(token: string): Promise<PassPhotoAdminItem[]> {
  return apiGet<PassPhotoAdminItem[]>('/api/admin/pass-photos', {
    headers: adminPassPhotoHeaders(token),
  })
}

export async function fetchAdminPassPhotoHistory(
  token: string,
  limit = 30,
): Promise<PassPhotoAdminItem[]> {
  return apiGet<PassPhotoAdminItem[]>(`/api/admin/pass-photos/history?limit=${limit}`, {
    headers: adminPassPhotoHeaders(token),
  })
}

export async function approvePassPhoto(token: string, id: string): Promise<PassPhotoSubmission> {
  return apiPost<PassPhotoSubmission>(`/api/admin/pass-photos/${id}/approve`, {}, {
    headers: adminPassPhotoHeaders(token),
  })
}

export async function rejectPassPhoto(
  token: string,
  id: string,
  reason: string,
): Promise<PassPhotoSubmission> {
  return apiPost<PassPhotoSubmission>(`/api/admin/pass-photos/${id}/reject`, { reason }, {
    headers: adminPassPhotoHeaders(token),
  })
}

export async function retryPassPhotoPerco(token: string, id: string): Promise<PassPhotoSubmission> {
  return apiPost<PassPhotoSubmission>(`/api/admin/pass-photos/${id}/retry-perco`, {}, {
    headers: adminPassPhotoHeaders(token),
  })
}

export async function revertPassPhoto(token: string, id: string): Promise<void> {
  await apiPost<{ ok: string }>(`/api/admin/pass-photos/${id}/revert`, {}, {
    headers: adminPassPhotoHeaders(token),
  })
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
