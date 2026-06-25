import { student } from '@/mocks/student'
import { programLabel } from '@/mocks/format'
import { useStudy } from '@/study'
import { useStudentProfile } from '@/student-profile-store'
import { isApiConfigured } from '@/apiClient'
import { Select } from '@/ui/Select/Select'
import styles from './program-picker.module.css'

type Props = {
  /**
   * Без видимой подписи поля — уместно в узком сайдбаре.
   * @default false
   */
  compact?: boolean
}

/**
 * Селектор «Текущая образовательная программа».
 * Меняет {@link useStudy}; от него зависят профиль, расписание, оценки.
 *
 * @param props - {@link Props}
 * @see {@link programLabel} — формат подписи в списке
 */
export function ProgramPicker({ compact = false }: Props) {
  const activeId = useStudy((s) => s.activeId)
  const pick = useStudy((s) => s.pick)
  const profile = useStudentProfile((s) => s.profile)

  if (isApiConfigured() && profile) {
    return null
  }

  const options = student.programs.map((p) => ({
    value: p.id,
    label: programLabel(p),
  }))

  return (
    <div className={[styles.wrap, compact ? styles.compact : ''].filter(Boolean).join(' ')}>
      <Select
        label={compact ? undefined : 'Текущая образовательная программа'}
        aria-label="Текущая образовательная программа"
        value={activeId}
        options={options}
        className={styles.select}
        onChange={(e) => pick(e.target.value)}
      />
    </div>
  )
}
