/**
 * @file Состояние выбранной образовательной программы.
 * Влияет на профиль, расписание, оценки и другие разделы, привязанные к обучению.
 */

import { create } from 'zustand'
import { student } from '@/mocks/student'
import type { StudyProgram } from '@/mocks/types'

type StudyState = {
  /** {@link StudyProgram.id} активной записи */
  activeId: string
  /**
   * Переключает учебный контекст.
   * @param id - id программы из {@link student.programs}
   */
  pick: (id: string) => void
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
 * @returns активная {@link StudyProgram}; если id не найден — первая из списка
 */
export function useCurrentProgram(): StudyProgram {
  const activeId = useStudy((s) => s.activeId)
  return student.programs.find((p) => p.id === activeId) ?? student.programs[0]
}
