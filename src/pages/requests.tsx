/**
 * @file Страница заявлений и справок.
 * @see {@link useRequests}
 */

import { useState, type FormEvent } from 'react'
import { deliveryOptions, requestStatusLabel, requestTypes, type RequestTypeId } from '@/mocks/requests-types'
import { formatRequestDate, useRequests } from '@/mocks/requests'
import { ScreenHeader, Button, Modal, Select, Textarea, Checkbox, NoData, StatusBadge } from '@/ui'
import styles from './requests.module.css'

type FormErrors = {
  type?: string
  comment?: string
  delivery?: string
  consent?: string
}

/**
 * Страница заявлений: список и форма создания.
 */
export function Requests() {
  const items = useRequests((s) => s.items)
  const add = useRequests((s) => s.add)

  const [open, setOpen] = useState(false)
  const [typeId, setTypeId] = useState<RequestTypeId>('study-place')
  const [comment, setComment] = useState('')
  const [delivery, setDelivery] = useState('office')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const typeOptions = requestTypes.map((t) => ({ value: t.id, label: t.label }))
  const deliverySelect = deliveryOptions.map((d) => ({ value: d.value, label: d.label }))

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!typeId) next.type = 'Выберите тип'
    if (!comment.trim()) next.comment = 'Добавьте комментарий'
    if (comment.trim().length > 500) next.comment = 'Не больше 500 символов'
    if (!delivery) next.delivery = 'Укажите способ получения'
    if (!consent) next.consent = 'Нужно согласие на обработку данных'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const deliveryLabel = deliveryOptions.find((d) => d.value === delivery)?.label ?? delivery
    add({ typeId, comment: comment.trim(), delivery: deliveryLabel })

    setOpen(false)
    setComment('')
    setConsent(false)
    setErrors({})
  }

  return (
    <>
      <ScreenHeader
        title="Заявления и справки (dev)"
        subtitle="Справки, обращения в деканат"
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            Создать заявление
          </Button>
        }
      />

      {items.length === 0 ? (
        <NoData title="Заявлений пока нет" />
      ) : (
        <ul className={styles.list}>
          {items.map((r) => (
            <li key={r.id} className={styles.item}>
              <div className={styles.itemHead}>
                <span className={styles.title}>{r.typeLabel}</span>
                <StatusBadge status={r.status} label={requestStatusLabel[r.status]} />
              </div>
              <p className={styles.meta}>
                № {r.id} · {formatRequestDate(r.createdAt)}
              </p>
              <p className={styles.meta}>{r.comment}</p>
              <p className={styles.meta}>Получение: {r.delivery}</p>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        title="Новое заявление"
        onClose={() => setOpen(false)}
        footer={
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" form="new-request-form">
              Отправить
            </Button>
          </div>
        }
      >
        <form id="new-request-form" className={styles.form} onSubmit={handleSubmit}>
          <Select
            label="Тип заявления"
            options={typeOptions}
            value={typeId}
            error={errors.type}
            onChange={(e) => setTypeId(e.target.value as RequestTypeId)}
          />
          <Textarea
            label="Комментарий"
            value={comment}
            error={errors.comment}
            maxLength={500}
            onChange={(e) => setComment(e.target.value)}
          />
          <Select
            label="Способ получения"
            options={deliverySelect}
            value={delivery}
            error={errors.delivery}
            onChange={(e) => setDelivery(e.target.value)}
          />
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
