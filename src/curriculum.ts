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

/** Все дисциплины плана (все разделы). */
export function allCurriculumItems(dto: StudentCurriculumDto): CurriculumItemDto[] {
  const items: CurriculumItemDto[] = []
  for (const section of dto.sections) {
    for (const group of section.groups) {
      items.push(...group.items)
    }
  }
  return items
}

/** Уникальные семестры из плана. */
export function curriculumSemesters(dto: StudentCurriculumDto): number[] {
  const set = new Set<number>()
  for (const item of allCurriculumItems(dto)) {
    for (const semester of item.semesters) {
      if (semester > 0) set.add(semester)
    }
  }
  return [...set].sort((a, b) => a - b)
}

/** Дисциплины, читаемые в выбранном семестре. */
export function itemsForSemester(dto: StudentCurriculumDto, semester: number): CurriculumItemDto[] {
  return allCurriculumItems(dto)
    .filter((item) => item.semesters.includes(semester))
    .sort((a, b) => a.title.localeCompare(b.title, 'ru'))
}

/** Форма контроля именно для семестра (иначе общая подпись). */
export function controlLabelForSemester(item: CurriculumItemDto, semester: number): string {
  const forSemester = item.controls.filter((c) => c.semester === semester)
  if (forSemester.length === 0) {
    return item.controlLabel || '—'
  }
  return forSemester
    .map((control) => {
      const type = control.type || 'Контроль'
      return type
    })
    .join('; ')
}

/** Семестр по умолчанию: из текущего рабочего плана или последний с дисциплинами. */
export function defaultCurriculumSemester(dto: StudentCurriculumDto): number {
  const semesters = curriculumSemesters(dto)
  if (semesters.length === 0) return 1
  const currentPlan = dto.workingStudyPlans.find((p) => p.current)
  if (currentPlan?.firstSemester) {
    const preferred = currentPlan.firstSemester
    if (semesters.includes(preferred)) return preferred
  }
  return semesters[semesters.length - 1]
}
