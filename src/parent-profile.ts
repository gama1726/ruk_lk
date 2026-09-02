/**
 * @file Профиль родителя с API.
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import type { StudentProfileDto } from '@/profile'

export type ParentProfileContractDto = {
  funding: string
  customerLabel: string
  paymentStatus: string
  paymentStatusLabel: string
  contractNumber: string
  contractDate: string
  contractDisplayDate: string
}

export type ParentProfileDto = {
  relation: string
  parentFullName: string
  parentEmail: string | null
  parentPhone: string | null
  isCustomer: boolean
  studentAdult: boolean
  studentId: string
  studentFullName: string
  dataAccessAllowed: boolean
  consentRequiredMessage: string | null
  student: StudentProfileDto | null
  academicDebtCount: number
  contract: ParentProfileContractDto | null
}

export const universityContacts = {
  phone: '+7 (495) 640-57-22',
  phoneHref: 'tel:+74956405722',
  email: 'info@ruc.su',
} as const

export async function fetchParentProfile(): Promise<ParentProfileDto> {
  return apiGet<ParentProfileDto>('/api/parent/profile')
}

export function isParentProfileApiEnabled(): boolean {
  return isApiConfigured()
}
