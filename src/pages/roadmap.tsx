import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, isApiConfigured } from '@/apiClient'
import {
  controlLabelForSemester,
  curriculumSemesters,
  defaultCurriculumSemester,
  fetchStudentCurriculum,
  isCurriculumApiEnabled,
  itemsForSemester,
  type CurriculumItemDto,
  type StudentCurriculumDto,
} from '@/curriculum'
import { paths } from '@/paths'
import { Loader, NoData } from '@/ui'
import styles from './roadmap.module.css'

function formatHours(value: number): string {
  const n = Number.isInteger(value) ? value : Math.round(value * 100) / 100
  const abs = Math.abs(n)
  const mod10 = Math.floor(abs) % 10
  const mod100 = Math.floor(abs) % 100
  let word = 'часов'
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) word = 'час'
    else if (mod10 >= 2 && mod10 <= 4) word = 'часа'
  }
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(n)} ${word}`
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={[styles.chevron, open ? styles.chevronOpen : ''].filter(Boolean).join(' ')}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ItemDetails({ item, semester }: { item: CurriculumItemDto; semester: number }) {
  const fields = [
    { label: 'Всего часов', value: formatHours(item.totalHours) },
    { label: 'Самостоятельной работы', value: formatHours(item.independentHours) },
    { label: 'Лекций', value: formatHours(item.lectureHours) },
    { label: 'Практики', value: formatHours(item.practiceHours) },
    { label: 'Лабораторные', value: formatHours(item.laboratoryHours) },
    { label: 'Форма контроля', value: controlLabelForSemester(item, semester) },
  ]

  return (
    <div className={styles.details}>
      {fields.map((field) => (
        <div key={field.label} className={styles.detail}>
          <span className={styles.detailLabel}>{field.label}</span>
          <span className={styles.detailValue}>{field.value}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Траектория обучения: дисциплины учебного плана по семестрам.
 */
export function Roadmap() {
  const apiEnabled = isCurriculumApiEnabled()
  const [data, setData] = useState<StudentCurriculumDto | null>(null)
  const [loading, setLoading] = useState(apiEnabled)
  const [error, setError] = useState<string | null>(null)
  const [semester, setSemester] = useState(1)
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!apiEnabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const result = await fetchStudentCurriculum()
        if (cancelled) return
        setData(result)
        const initial = defaultCurriculumSemester(result)
        setSemester(initial)
        const first = itemsForSemester(result, initial)[0]
        setOpenItems(first ? new Set([`${first.id}|${initial}`]) : new Set())
      } catch (err) {
        if (cancelled) return
        setData(null)
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить траекторию')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  const semesters = useMemo(() => (data ? curriculumSemesters(data) : []), [data])
  const semesterItems = useMemo(
    () => (data ? itemsForSemester(data, semester) : []),
    [data, semester],
  )

  useEffect(() => {
    if (semesters.length === 0) return
    if (!semesters.includes(semester)) {
      setSemester(semesters[semesters.length - 1])
    }
  }, [semester, semesters])

  const onSelectSemester = (n: number) => {
    setSemester(n)
    if (!data) {
      setOpenItems(new Set())
      return
    }
    const first = itemsForSemester(data, n)[0]
    setOpenItems(first ? new Set([`${first.id}|${n}`]) : new Set())
  }

  const toggleItem = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className={styles.page}>
      <nav className={styles.bread} aria-label="Навигация">
        <Link to={paths.education}>Обучение</Link>
        <span className={styles.breadSep}>/</span>
        <span>Траектория обучения</span>
      </nav>

      {loading ? (
        <Loader />
      ) : !isApiConfigured() ? (
        <NoData title="Подключите API, чтобы загрузить траекторию из учебного плана" />
      ) : error ? (
        <NoData title={error} />
      ) : !data || semesters.length === 0 ? (
        <NoData title="Траектория не найдена" />
      ) : (
        <>
          {(data.specialty || data.group) && (
            <div className={styles.meta}>
              {data.specialty ? <p className={styles.metaLine}>{data.specialty}</p> : null}
              <p className={styles.metaMuted}>
                {[data.group, data.currentCourse].filter(Boolean).join(' · ')}
              </p>
            </div>
          )}

          <div className={styles.semesterPick}>
            <span className={styles.semesterLabel}>Выберите семестр:</span>
            <div className={styles.semesterBtns}>
              {semesters.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={[styles.semesterBtn, semester === n ? styles.semesterBtnActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelectSemester(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            {semesterItems.length === 0 ? (
              <div className={styles.empty}>
                <NoData title="В этом семестре дисциплин нет" />
              </div>
            ) : (
              <div className={styles.list}>
                {semesterItems.map((item) => {
                  const key = `${item.id}|${semester}`
                  const open = openItems.has(key)
                  return (
                    <div key={key} className={styles.item}>
                      <button
                        type="button"
                        className={styles.itemHead}
                        onClick={() => toggleItem(key)}
                        aria-expanded={open}
                      >
                        <span className={styles.itemTitle}>{item.title}</span>
                        <Chevron open={open} />
                      </button>
                      {open ? <ItemDetails item={item} semester={semester} /> : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
