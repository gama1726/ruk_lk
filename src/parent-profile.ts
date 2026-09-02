/**
 * @file Профиль родителя с API.
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import type { StudentProfileDto } from '@/profile'

export type ParentProfileDto = {
  relation: string
  parentFullName: string
  isCustomer: boolean
  studentAdult: boolean
  studentId: string
  studentFullName: string
  dataAccessAllowed: boolean
  consentRequiredMessage: string | null
  student: StudentProfileDto | null
}

export async function fetchParentProfile(): Promise<ParentProfileDto> {
  return apiGet<ParentProfileDto>('/api/parent/profile')
}

export function isParentProfileApiEnabled(): boolean {
  return isApiConfigured()
}
