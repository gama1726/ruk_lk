import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, isApiConfigured } from '@/apiClient'
import {
  controlLabelForSemester,
  curriculumSemesters,
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
      width="18"
      height="18"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ItemCard({
  item,
  semester,
  open,
  onToggle,
}: {
  item: CurriculumItemDto
  semester: number
  open: boolean
  onToggle: () => void
}) {
  const fields = [
    { label: 'Всего часов', value: formatHours(item.totalHours) },
    { label: 'Самостоятельной работы', value: formatHours(item.independentHours) },
    { label: 'Лекций', value: formatHours(item.lectureHours) },
    { label: 'Практики', value: formatHours(item.practiceHours) },
    { label: 'Лабораторные', value: formatHours(item.laboratoryHours) },
    { label: 'Форма контроля', value: controlLabelForSemester(item, semester) },
  ]

  return (
    <article className={[styles.card, open ? styles.cardOpen : ''].filter(Boolean).join(' ')}>
      <button type="button" className={styles.cardHead} onClick={onToggle} aria-expanded={open}>
        <span className={styles.cardTitle}>{item.title}</span>
        <Chevron open={open} />
      </button>

      <div className={[styles.cardBody, open ? styles.cardBodyOpen : ''].filter(Boolean).join(' ')}>
        <div className={styles.cardBodyInner}>
          <div className={styles.details}>
            {fields.map((field) => (
              <div key={field.label} className={styles.detail}>
                <span className={styles.detailLabel}>{field.label}</span>
                <span className={styles.detailValue}>{field.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

function SemesterList({
  semester,
  items,
  openItems,
  onToggleItem,
}: {
  semester: number
  items: CurriculumItemDto[]
  openItems: Set<string>
  onToggleItem: (key: string) => void
}) {
  if (items.length === 0) {
    return <NoData title="В этом семестре дисциплин нет" />
  }

  return (
    <div className={styles.list}>
      {items.map((item) => {
        const key = `${item.id}|${semester}`
        return (
          <ItemCard
            key={key}
            item={item}
            semester={semester}
            open={openItems.has(key)}
            onToggle={() => onToggleItem(key)}
          />
        )
      })}
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
  const [semester, setSemester] = useState<number | null>(null)
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
        setSemester(null)
        setOpenItems(new Set())
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
    () => (data && semester != null ? itemsForSemester(data, semester) : []),
    [data, semester],
  )

  const onSelectSemester = (n: number) => {
    setSemester(n)
    setOpenItems(new Set())
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
        <span className={styles.breadCurrent}>Траектория обучения</span>
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

          <div className={styles.content}>
            {semester == null ? null : (
              <SemesterList
                semester={semester}
                items={semesterItems}
                openItems={openItems}
                onToggleItem={toggleItem}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
