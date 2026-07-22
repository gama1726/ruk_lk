/**
 * @file Портфолио достижений (1С или демо-мок).
 */

import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '@/apiClient'
import { achievementTypes, portfolioStatusLabel, type AchievementTypeId } from '@/mocks/portfolio-types'
import { formatAchievementDate, usePortfolio } from '@/mocks/portfolio'
import {
  fetchStudentPortfolio,
  isPortfolioApiEnabled,
  type StudentPortfolioItemDto,
} from '@/portfolio'
import { ScreenHeader, Button, Modal, Select, Input, NoData, StatusBadge } from '@/ui'
import common from './service-common.module.css'
import styles from './portfolio.module.css'

type FormErrors = { type?: string; title?: string; date?: string }

type ViewItem = {
  id: string
  title: string
  typeLabel: string
  dateLabel: string
  statusLabel: string | null
  statusKey: 'draft' | 'moderation' | 'approved' | 'rejected' | null
  document: string | null
}

function mapApiItem(item: StudentPortfolioItemDto): ViewItem {
  const statusRaw = (item.status || '').toLowerCase()
  let statusKey: ViewItem['statusKey'] = null
  if (statusRaw.includes('отклон') || statusRaw.includes('reject')) statusKey = 'rejected'
  else if (statusRaw.includes('модерац') || statusRaw.includes('ожид') || statusRaw.includes('pending')) {
    statusKey = 'moderation'
  } else if (statusRaw.includes('принят') || statusRaw.includes('утвержд') || statusRaw.includes('approv')) {
    statusKey = 'approved'
  } else if (statusRaw.includes('чернов') || statusRaw.includes('draft')) {
    statusKey = 'draft'
  }

  return {
    id: item.id,
    title: item.title || 'Без названия',
    typeLabel: item.type || 'Достижение',
    dateLabel: item.displayDate || (item.date ? formatAchievementDate(item.date) : '—'),
    statusLabel: item.status || (statusKey ? portfolioStatusLabel[statusKey] : null),
    statusKey,
    document: item.document || null,
  }
}

/**
 * Портфолио: из 1С (только просмотр) или локальный мок с добавлением.
 */
export function Portfolio() {
  const apiEnabled = isPortfolioApiEnabled()
  const mockItems = usePortfolio((s) => s.items)
  const add = usePortfolio((s) => s.add)

  const [apiItems, setApiItems] = useState<ViewItem[]>([])
  const [loading, setLoading] = useState(apiEnabled)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [typeId, setTypeId] = useState<AchievementTypeId>('project')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-06-19')
  const [errors, setErrors] = useState<FormErrors>({})

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
        const data = await fetchStudentPortfolio()
        if (!cancelled) {
          setApiItems(data.items.map(mapApiItem))
        }
      } catch (e) {
        if (!cancelled) {
          setApiItems([])
          setError(e instanceof ApiError ? e.message : 'Не удалось загрузить портфолио')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  const items: ViewItem[] = apiEnabled
    ? apiItems
    : mockItems.map((item) => ({
        id: item.id,
        title: item.title,
        typeLabel: item.typeLabel,
        dateLabel: formatAchievementDate(item.date),
        statusLabel: portfolioStatusLabel[item.status],
        statusKey: item.status,
        document: item.documentName ?? null,
      }))

  const typeOptions = achievementTypes.map((t) => ({ value: t.id, label: t.label }))

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!typeId) next.type = 'Выберите тип'
    if (!title.trim()) next.title = 'Укажите название'
    if (title.trim().length > 120) next.title = 'Не больше 120 символов'
    if (!date) next.date = 'Укажите дату'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    add({ typeId, title: title.trim(), date })
    setOpen(false)
    setTitle('')
    setErrors({})
  }

  return (
    <>
      <ScreenHeader
        title="Портфолио"
        subtitle={
          apiEnabled
            ? 'Достижения из учебной системы'
            : 'Демо: достижения и модерация'
        }
        actions={
          !apiEnabled ? (
            <Button type="button" onClick={() => setOpen(true)}>
              Добавить достижение
            </Button>
          ) : undefined
        }
      />

      {loading && <p>Загрузка…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && items.length === 0 ? (
        <NoData title="Достижений пока нет" />
      ) : !loading && items.length > 0 ? (
        <ul className={common.list}>
          {items.map((item) => (
            <li key={item.id} className={common.item}>
              <div className={common.itemHead}>
                <span className={common.itemTitle}>{item.title}</span>
                {item.statusKey && item.statusLabel ? (
                  <StatusBadge status={item.statusKey} label={item.statusLabel} />
                ) : item.statusLabel ? (
                  <span className={common.meta}>{item.statusLabel}</span>
                ) : null}
              </div>
              <p className={common.meta}>
                {item.typeLabel} · {item.dateLabel}
              </p>
              {item.document ? <p className={styles.doc}>Документ: {item.document}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!apiEnabled && (
        <Modal
          open={open}
          title="Новое достижение"
          onClose={() => setOpen(false)}
          footer={
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" form="portfolio-form">
                Отправить на модерацию
              </Button>
            </div>
          }
        >
          <form id="portfolio-form" className={styles.form} onSubmit={handleSubmit}>
            <Select
              label="Тип"
              options={typeOptions}
              value={typeId}
              error={errors.type}
              onChange={(e) => setTypeId(e.target.value as AchievementTypeId)}
            />
            <Input
              label="Название"
              value={title}
              error={errors.title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Дата"
              type="date"
              value={date}
              error={errors.date}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className={common.meta}>Добавление в 1С пока недоступно — только просмотр из API.</p>
          </form>
        </Modal>
      )}
    </>
  )
}
