/**
 * @file Психологическая поддержка.
 * @see {@link usePsychologist}
 */

import { useState, type FormEvent } from 'react'
import {
  availableSlots,
  consultationStatusLabel,
  consultationTopics,
  formatConsultDate,
  psychologistInfo,
  usePsychologist,
} from '@/mocks/psychologist'
import { ScreenHeader, Button, Modal, Select, Textarea, Checkbox, NoData, StatusBadge } from '@/ui'
import common from './service-common.module.css'
import styles from './psychologist.module.css'

type FormErrors = { slot?: string; topic?: string; note?: string; consent?: string }

const statusKey = { scheduled: 'scheduled', completed: 'approved', cancelled: 'cancelled' } as const

/**
 * Психологическая поддержка: запись и история без чувствительных деталей.
 */
export function Psychologist() {
  const consultations = usePsychologist((s) => s.consultations)
  const book = usePsychologist((s) => s.book)

  const [open, setOpen] = useState(false)
  const [slot, setSlot] = useState<string>(availableSlots[0].value)
  const [topicId, setTopicId] = useState<string>(consultationTopics[0].value)
  const [note, setNote] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const slotOptions = availableSlots.map((s) => ({ value: s.value, label: s.label }))
  const topicOptions = consultationTopics.map((t) => ({ value: t.value, label: t.label }))

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!slot) next.slot = 'Выберите время'
    if (!topicId) next.topic = 'Выберите тему'
    if (topicId === 'other' && !note.trim()) next.note = 'Кратко опишите запрос'
    if (note.length > 300) next.note = 'Не больше 300 символов'
    if (!consent) next.consent = 'Нужно согласие на обработку данных'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const topicLabel = consultationTopics.find((t) => t.value === topicId)?.label ?? topicId
    const topic = topicId === 'other' && note.trim() ? note.trim() : topicLabel
    book({ slot, topic, note: note.trim() })

    setOpen(false)
    setNote('')
    setConsent(false)
    setErrors({})
  }

  const info = psychologistInfo

  return (
    <>
      <ScreenHeader
        title="Психологическая поддержка"
        subtitle="Конфиденциальные консультации"
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            Записаться
          </Button>
        }
      />

      <div className={styles.info}>
        <p className={styles.infoTitle}>{info.title}</p>
        <p className={common.meta}>{info.hours} · {info.location}</p>
        <p className={common.meta}>Телефон: {info.phone}</p>
        <p className={common.meta}>{info.note}</p>
      </div>

      <section className={common.section}>
        <h2 className={common.sectionTitle}>Мои консультации</h2>
        {consultations.length === 0 ? (
          <NoData title="Записей пока нет" />
        ) : (
          <ul className={common.list}>
            {consultations.map((c) => (
              <li key={c.id} className={common.item}>
                <div className={common.itemHead}>
                  <span className={common.itemTitle}>{c.topic}</span>
                  <StatusBadge status={statusKey[c.status]} label={consultationStatusLabel[c.status]} />
                </div>
                <p className={common.meta}>
                  {formatConsultDate(c.date)}, {c.time}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={open}
        title="Запись на консультацию"
        onClose={() => setOpen(false)}
        footer={
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" form="psy-book-form">
              Записаться
            </Button>
          </div>
        }
      >
        <form id="psy-book-form" className={styles.form} onSubmit={handleSubmit}>
          <Select
            label="Дата и время"
            options={slotOptions}
            value={slot}
            error={errors.slot}
            onChange={(e) => setSlot(e.target.value)}
          />
          <Select
            label="Тема"
            options={topicOptions}
            value={topicId}
            error={errors.topic}
            onChange={(e) => setTopicId(e.target.value)}
          />
          {topicId === 'other' ? (
            <Textarea
              label="Кратко опишите запрос"
              value={note}
              error={errors.note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
            />
          ) : null}
          <Checkbox
            label="Согласен на обработку персональных данных"
            checked={consent}
            error={errors.consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
        </form>
      </Modal>
    </>
  )
}
