import { useMemo, useState } from 'react'
import { programLabel } from '@/mocks/format'
import { filterTeachers, teacherDepartments } from '@/mocks/teachers'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, Select, Button, NoData } from '@/ui'
import styles from './teachers.module.css'

/**
 * Открывает почтовый клиент — frontend-заглушка без сохранения данных.
 * @param email - адрес преподавателя
 */
function writeMessage(email: string) {
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Вопрос по дисциплине')}`
}

/**
 * Список преподавателей с фильтром по кафедре.
 */
export function Teachers() {
  const program = useCurrentProgram()
  const departments = useMemo(() => teacherDepartments(program.id), [program.id])
  const [department, setDepartment] = useState('all')

  const rows = filterTeachers(program.id, department)
  const deptOptions = [{ value: 'all', label: 'Все кафедры' }, ...departments.map((d) => ({ value: d, label: d }))]

  return (
    <>
      <ScreenHeader title="Преподаватели" subtitle={programLabel(program)} />

      <div className={styles.filters}>
        <Select label="Кафедра" options={deptOptions} value={department} onChange={(e) => setDepartment(e.target.value)} />
      </div>

      {rows.length === 0 ? (
        <NoData title="Преподаватели не найдены" />
      ) : (
        <ul className={styles.list}>
          {rows.map((t) => (
            <li key={t.id} className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.name}>{t.name}</h2>
              </div>
              <p className={styles.meta}>{t.department}</p>
              <p className={styles.subjects}>{t.subjects.join(' · ')}</p>
              <p className={styles.meta}>{t.email}</p>
              <p className={styles.meta}>Консультации: {t.consultation}</p>
              <div className={styles.actions}>
                <Button type="button" variant="secondary" size="sm" onClick={() => writeMessage(t.email)}>
                  Написать сообщение
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
