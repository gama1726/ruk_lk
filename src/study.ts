/**
 * @file Состояние выбранной образовательной программы.
 * Влияет на профиль, расписание, оценки и другие разделы, привязанные к обучению.
 */

import { create } from 'zustand'
import { isApiConfigured } from '@/apiClient'
import { student } from '@/mocks/student'
import type { StudyProgram } from '@/mocks/types'
import type { StudentProfileDto } from '@/profile'
import { useStudentProfile } from '@/student-profile-store'

type StudyState = {
  /** {@link StudyProgram.id} активной записи */
  activeId: string
  /**
   * Переключает учебный контекст.
   * @param id - id программы из {@link student.programs}
   */
  pick: (id: string) => void
}

/** Профиль API → одна учебная запись для UI. */
export function profileToStudyProgram(p: StudentProfileDto): StudyProgram {
  const parsed = parseInt(p.course, 10)
  return {
    id: p.studentId,
    recordCode: '',
    cardNumber: p.studentId,
    level: p.level as StudyProgram['level'],
    direction: p.direction,
    group: p.group,
    course: Number.isNaN(parsed) ? 0 : parsed,
    form: p.educationForm,
    status: p.status,
    faculty: p.faculty,
    department: p.department,
  }
}

/**
 * Zustand-стор выбранной программы.
 * @remarks Держим только в памяти: после F5 снова первая программа из мока.
 * @see {@link useCurrentProgram}
 */
export const useStudy = create<StudyState>((set) => ({
  activeId: student.programs[0].id,
  pick: (id) => set({ activeId: id }),
}))

/**
 * Хук: текущая программа с учётом выбора в {@link useStudy}.
 * @returns активная {@link StudyProgram}; при API — из профиля 1С
 */
export function useCurrentProgram(): StudyProgram {
  const activeId = useStudy((s) => s.activeId)
  const profile = useStudentProfile((s) => s.profile)

  if (isApiConfigured() && profile) {
    return profileToStudyProgram(profile)
  }

  return student.programs.find((p) => p.id === activeId) ?? student.programs[0]
}
