/**
 * @file Учебный план с backend API (1С curriculum).
 */

import { apiGet, isApiConfigured } from '@/apiClient'

export type CurriculumControlDto = {
  type: string
  semester: number
  periodControl: string
  course: number
  hours: number
}

export type CurriculumItemDto = {
  id: string
  typeRecord: string
  title: string
  totalHours: number
  auditoryHours: number
  independentHours: number
  lectureHours: number
  practiceHours: number
  laboratoryHours: number
  creditUnits: number
  semesters: number[]
  controlLabel: string
  controls: CurriculumControlDto[]
}

export type CurriculumGroupDto = {
  title: string
  itemsCount: number
  items: CurriculumItemDto[]
}

export type CurriculumSectionDto = {
  code: string
  title: string
  itemsCount: number
  groups: CurriculumGroupDto[]
}

export type CurriculumWorkingPlanDto = {
  presentation: string
  number: string
  date: string
  displayDate: string
  current: boolean
  firstSemester: number
  lastSemester: number
}

export type StudentCurriculumDto = {
  studentId: string
  studentFullName: string
  recordBook: string
  asOfDate: string
  faculty: string
  specialty: string
  group: string
  currentCourse: string
  studentState: string
  studyPlan: string
  hoursPerCreditUnit: number
  itemsCount: number
  workingStudyPlans: CurriculumWorkingPlanDto[]
  sections: CurriculumSectionDto[]
}

export async function fetchStudentCurriculum(): Promise<StudentCurriculumDto> {
  return apiGet<StudentCurriculumDto>('/api/student/curriculum')
}

export function isCurriculumApiEnabled(): boolean {
  return isApiConfigured()
}

/** «Плоский» раздел без лишнего уровня группы (ГИА / факультативы). */
export function flattenSectionItems(section: CurriculumSectionDto): CurriculumItemDto[] | null {
  if (section.groups.length !== 1) return null
  const group = section.groups[0]
  if (group.title.trim().toLowerCase() !== section.title.trim().toLowerCase()) return null
  return group.items
}
