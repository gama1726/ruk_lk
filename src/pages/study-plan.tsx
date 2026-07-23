import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, isApiConfigured } from '@/apiClient'
import {
  fetchStudentCurriculum,
  flattenSectionItems,
  isCurriculumApiEnabled,
  type CurriculumGroupDto,
  type CurriculumItemDto,
  type CurriculumSectionDto,
  type StudentCurriculumDto,
} from '@/curriculum'
import { paths } from '@/paths'
import { Loader, NoData } from '@/ui'
import styles from './study-plan.module.css'

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

function formatCredits(value: number): string {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)} з.е.`
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

function ItemDetails({ item }: { item: CurriculumItemDto }) {
  const fields = [
    { label: 'Всего часов', value: formatHours(item.totalHours) },
    { label: 'Аудиторных', value: formatHours(item.auditoryHours) },
    { label: 'Самостоятельной работы', value: formatHours(item.independentHours) },
    { label: 'Лекций', value: formatHours(item.lectureHours) },
    { label: 'Практики', value: formatHours(item.practiceHours) },
    { label: 'Лабораторные', value: formatHours(item.laboratoryHours) },
    { label: 'Трудоемкость', value: formatCredits(item.creditUnits) },
    {
      label: 'Форма контроля',
      value: item.controlLabel || '—',
    },
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

function ItemAccordion({
  item,
  open,
  onToggle,
}: {
  item: CurriculumItemDto
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className={styles.item}>
      <button type="button" className={styles.itemHead} onClick={onToggle} aria-expanded={open}>
        <span className={styles.itemTitle}>{item.title}</span>
        <Chevron open={open} />
      </button>
      {open ? <ItemDetails item={item} /> : null}
    </div>
  )
}

function GroupAccordion({
  group,
  open,
  onToggle,
  openItems,
  onToggleItem,
}: {
  group: CurriculumGroupDto
  open: boolean
  onToggle: () => void
  openItems: Set<string>
  onToggleItem: (id: string) => void
}) {
  return (
    <div className={styles.group}>
      <button type="button" className={styles.groupHead} onClick={onToggle} aria-expanded={open}>
        <span>{group.title}</span>
        <Chevron open={open} />
      </button>
      {open ? (
        <div className={styles.groupBody}>
          {group.items.map((item) => (
            <ItemAccordion
              key={item.id}
              item={item}
              open={openItems.has(item.id)}
              onToggle={() => onToggleItem(item.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Учебный план: разделы 1С (дисциплины / практика / ГИА / факультативы).
 */
export function StudyPlan() {
  const apiEnabled = isCurriculumApiEnabled()
  const [data, setData] = useState<StudentCurriculumDto | null>(null)
  const [loading, setLoading] = useState(apiEnabled)
  const [error, setError] = useState<string | null>(null)
  const [sectionCode, setSectionCode] = useState<string>('')
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set())
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
        const first = result.sections[0]?.code ?? ''
        setSectionCode(first)
        const firstGroup = result.sections[0]?.groups[0]
        if (firstGroup) {
          setOpenGroups(new Set([`${first}|${firstGroup.title}`]))
        }
      } catch (err) {
        if (cancelled) return
        setData(null)
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить учебный план')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  const section: CurriculumSectionDto | null = useMemo(() => {
    if (!data) return null
    return data.sections.find((s) => s.code === sectionCode) ?? data.sections[0] ?? null
  }, [data, sectionCode])

  const flatItems = section ? flattenSectionItems(section) : null

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onSelectSection = (code: string) => {
    setSectionCode(code)
    setOpenItems(new Set())
    const selected = data?.sections.find((s) => s.code === code)
    const firstGroup = selected?.groups[0]
    if (selected && firstGroup && !flattenSectionItems(selected)) {
      setOpenGroups(new Set([`${code}|${firstGroup.title}`]))
    } else {
      setOpenGroups(new Set())
    }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.bread} aria-label="Навигация">
        <Link to={paths.education}>Обучение</Link>
        <span className={styles.breadSep}>/</span>
        <span>Учебный план</span>
      </nav>

      {loading ? (
        <Loader />
      ) : !isApiConfigured() ? (
        <NoData title="Подключите API, чтобы загрузить учебный план из 1С" />
      ) : error ? (
        <NoData title={error} />
      ) : !data || data.sections.length === 0 ? (
        <NoData title="Учебный план не найден" />
      ) : (
        <>
          {(data.specialty || data.group || data.studyPlan) && (
            <div className={styles.meta}>
              {data.specialty ? <p className={styles.metaLine}>{data.specialty}</p> : null}
              <p className={styles.metaMuted}>
                {[data.group, data.currentCourse].filter(Boolean).join(' · ')}
              </p>
              {data.studyPlan ? <p className={styles.metaMuted}>{data.studyPlan}</p> : null}
            </div>
          )}

          <p className={styles.sectionLabel}>Выберите раздел плана:</p>
          <div className={styles.tabs} role="tablist" aria-label="Разделы учебного плана">
            {data.sections.map((s) => (
              <button
                key={s.code}
                type="button"
                role="tab"
                aria-selected={section?.code === s.code}
                className={[styles.tab, section?.code === s.code ? styles.tabActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectSection(s.code)}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className={styles.panel}>
            {!section || (flatItems && flatItems.length === 0) || (!flatItems && section.groups.length === 0) ? (
              <NoData title="В этом разделе записей нет" />
            ) : flatItems ? (
              <div className={styles.list}>
                {flatItems.map((item) => (
                  <ItemAccordion
                    key={item.id}
                    item={item}
                    open={openItems.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.list}>
                {section.groups.map((group) => {
                  const key = `${section.code}|${group.title}`
                  return (
                    <GroupAccordion
                      key={key}
                      group={group}
                      open={openGroups.has(key)}
                      onToggle={() => toggleGroup(key)}
                      openItems={openItems}
                      onToggleItem={toggleItem}
                    />
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
