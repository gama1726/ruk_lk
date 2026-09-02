/**
 * @file Профиль родителя с API.
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import type { StudentProfileDto } from '@/profile'
import {
  universityContactsForBranch,
  universityContactsShort,
} from '@/mocks/university-contacts'

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

export const universityContacts = universityContactsShort

export function parentUniversityContacts(student: StudentProfileDto | null | undefined) {
  return universityContactsForBranch(student?.branch)
}

export async function fetchParentProfile(): Promise<ParentProfileDto> {
  return apiGet<ParentProfileDto>('/api/parent/profile')
}

export function isParentProfileApiEnabled(): boolean {
  return isApiConfigured()
}
