/**
 * @file API справок (студент / родитель / админ ЛК).
 */

import { apiGet, apiPost, apiPostFormData, getApiBaseUrl, isApiConfigured } from '@/apiClient'
import { preparePassPhotoFile } from '@/pass-photo-validation'
import type { AbsenceReportCampus } from '@/lk-admin'

export type CertificateType = 'SICK_LEAVE' | 'MILITARY_EXEMPTION' | 'OTHER'
export type CertificateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type CertificateAttachment = {
  id: string
  originalFilename: string
  contentType: string
  sizeBytes: number
}

export type CertificateRequest = {
  id: string
  studentId: string
  studentFullName: string
  campus: string
  type: CertificateType | string
  typeLabel: string
  status: CertificateStatus | string
  submittedBy: string
  submitterName: string | null
  comment: string | null
  rejectionReason: string | null
  approvedFrom: string | null
  approvedTo: string | null
  createdAt: string
  reviewedAt: string | null
  reviewedBy?: string | null
  group?: string | null
  faculty?: string | null
  course?: string | null
  department?: string | null
  attachments: CertificateAttachment[]
}

export type CertificateSummary = {
  id: string
  studentId: string
  studentFullName: string
  type: string
  typeLabel: string
  status: CertificateStatus | string
  createdAt: string
  approvedFrom?: string | null
  approvedTo?: string | null
  rejectionReason?: string | null
}

export const CERTIFICATE_TYPE_OPTIONS: { value: CertificateType; label: string }[] = [
  { value: 'SICK_LEAVE', label: 'Больничный' },
  { value: 'MILITARY_EXEMPTION', label: 'Освобождение от военкомата' },
  { value: 'OTHER', label: 'Прочее' },
]

export const CERTIFICATE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*'

export const CERTIFICATE_MAX_FILES = 5
export const CERTIFICATE_MAX_BYTES = 50 * 1024 * 1024

export function certificateStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'На проверке'
    case 'APPROVED':
      return 'Одобрена'
    case 'REJECTED':
      return 'Отклонена'
    case 'CANCELLED':
      return 'Отозвана'
    default:
      return status
  }
}

async function prepareCertificateFile(file: File): Promise<File> {
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  if (name.endsWith('.pdf') || type.includes('pdf')) {
    return file
  }
  return preparePassPhotoFile(file)
}

export async function prepareCertificateFiles(files: File[]): Promise<File[]> {
  const out: File[] = []
  for (const file of files) {
    if (file.size > CERTIFICATE_MAX_BYTES) {
      throw new Error(`Файл больше 50 МБ: ${file.name}`)
    }
    out.push(await prepareCertificateFile(file))
  }
  return out
}

type Audience = 'student' | 'parent'

function basePath(audience: Audience): string {
  return audience === 'parent' ? '/api/parent/certificates' : '/api/student/certificates'
}

export function listMyCertificates(audience: Audience): Promise<CertificateSummary[]> {
  return apiGet<CertificateSummary[]>(basePath(audience))
}

export function getMyCertificate(audience: Audience, id: string): Promise<CertificateRequest> {
  return apiGet<CertificateRequest>(`${basePath(audience)}/${id}`)
}

export async function submitCertificate(
  audience: Audience,
  type: CertificateType,
  comment: string,
  files: File[],
): Promise<CertificateRequest> {
  const prepared = await prepareCertificateFiles(files)
  const form = new FormData()
  form.append('type', type)
  if (comment.trim()) form.append('comment', comment.trim())
  for (const file of prepared) {
    form.append('files', file)
  }
  return apiPostFormData<CertificateRequest>(basePath(audience), form)
}

export function cancelCertificate(audience: Audience, id: string): Promise<CertificateRequest> {
  return apiPost<CertificateRequest>(`${basePath(audience)}/${id}/cancel`, {})
}

export function myCertificateAttachmentUrl(
  audience: Audience,
  requestId: string,
  attachmentId: string,
): string {
  return `${getApiBaseUrl()}${basePath(audience)}/${requestId}/attachments/${attachmentId}`
}

export function getAdminCertificate(
  campus: AbsenceReportCampus,
  id: string,
): Promise<CertificateRequest> {
  return apiGet<CertificateRequest>(
    `/api/admin/lk/certificates/${campus.toLowerCase()}/requests/${id}`,
  )
}

export function approveCertificate(
  campus: AbsenceReportCampus,
  id: string,
  from: string,
  to: string,
): Promise<CertificateRequest> {
  return apiPost<CertificateRequest>(
    `/api/admin/lk/certificates/${campus.toLowerCase()}/requests/${id}/approve`,
    { from, to },
  )
}

export function rejectCertificate(
  campus: AbsenceReportCampus,
  id: string,
  reason: string,
): Promise<CertificateRequest> {
  return apiPost<CertificateRequest>(
    `/api/admin/lk/certificates/${campus.toLowerCase()}/requests/${id}/reject`,
    { reason },
  )
}

export function adminCertificateAttachmentUrl(
  campus: AbsenceReportCampus,
  requestId: string,
  attachmentId: string,
): string {
  return `${getApiBaseUrl()}/api/admin/lk/certificates/${campus.toLowerCase()}/requests/${requestId}/attachments/${attachmentId}`
}

export function isCertificatesApiEnabled(): boolean {
  return isApiConfigured()
}
