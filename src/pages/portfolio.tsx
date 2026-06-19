/**
 * @file Портфолио достижений.
 * @see {@link usePortfolio}
 */

import { useState, type FormEvent } from 'react'
import { achievementTypes, portfolioStatusLabel, type AchievementTypeId } from '@/mocks/portfolio-types'
import { formatAchievementDate, usePortfolio } from '@/mocks/portfolio'
import { ScreenHeader, Button, Modal, Select, Input, NoData, StatusBadge } from '@/ui'
import common from './service-common.module.css'
import styles from './portfolio.module.css'

type FormErrors = { type?: string; title?: string; date?: string }

/**
 * Портфолио достижений с модерацией.
 */
export function Portfolio() {
  const items = usePortfolio((s) => s.items)
  const add = usePortfolio((s) => s.add)

  const [open, setOpen] = useState(false)
  const [typeId, setTypeId] = useState<AchievementTypeId>('project')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-06-19')
  const [errors, setErrors] = useState<FormErrors>({})

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
        subtitle="Достижения и подтверждающие документы"
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            Добавить достижение
          </Button>
        }
      />

      {items.length === 0 ? (
        <NoData title="Достижений пока нет" />
      ) : (
        <ul className={common.list}>
          {items.map((item) => (
            <li key={item.id} className={common.item}>
              <div className={common.itemHead}>
                <span className={common.itemTitle}>{item.title}</span>
                <StatusBadge status={item.status} label={portfolioStatusLabel[item.status]} />
              </div>
              <p className={common.meta}>
                {item.typeLabel} · {formatAchievementDate(item.date)}
              </p>
              {item.documentName ? <p className={styles.doc}>Документ: {item.documentName}</p> : null}
            </li>
          ))}
        </ul>
      )}

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
          <p className={common.meta}>Файл можно будет прикрепить после подключения backend.</p>
        </form>
      </Modal>
    </>
  )
}
