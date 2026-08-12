import { useEffect, useState } from 'react'
import { Button, Modal, Textarea } from '@/ui'
import {
  passPhotoRejectReasons,
  type PassPhotoRejectReason,
} from '@/pages/admin-pass-photo-reject-reasons'
import styles from './admin-pass-photo-reject-modal.module.css'

type Props = {
  open: boolean
  studentName: string
  zachetka: string
  busy?: boolean
  onClose: () => void
  onConfirm: (reason: string) => void | Promise<void>
}

export function AdminPassPhotoRejectModal({
  open,
  studentName,
  zachetka,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReason('')
    setSelectedId(null)
    setError(null)
  }, [open, studentName, zachetka])

  const pickTemplate = (template: PassPhotoRejectReason) => {
    setSelectedId(template.id)
    setReason(template.text)
    setError(null)
  }

  const onReasonChange = (value: string) => {
    setReason(value)
    setError(null)
    const match = passPhotoRejectReasons.find((t) => t.text === value.trim())
    setSelectedId(match?.id ?? null)
  }

  const handleSubmit = async () => {
    const trimmed = reason.trim()
    if (!trimmed) {
      setError('Укажите причину отклонения')
      return
    }
    if (trimmed.length > 500) {
      setError('Не больше 500 символов')
      return
    }
    await onConfirm(trimmed)
  }

  return (
    <Modal
      open={open}
      title="Отклонить заявку"
      onClose={busy ? () => {} : onClose}
      footer={
        <div className={styles.footerActions}>
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
            Отмена
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void handleSubmit()}>
            Отклонить
          </Button>
        </div>
      }
    >
      <p className={styles.studentHint}>
        Студент: <strong>{studentName}</strong>
        {zachetka ? <> · зачётка {zachetka}</> : null}
      </p>

      <div className={styles.templates}>
        <span className={styles.templatesLabel}>Шаблоны</span>
        <div className={styles.templateList}>
          {passPhotoRejectReasons.map((template) => (
            <button
              key={template.id}
              type="button"
              className={[
                styles.templateChip,
                selectedId === template.id ? styles.templateChipActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={busy}
              onClick={() => pickTemplate(template)}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Причина для студента"
        value={reason}
        rows={4}
        maxLength={500}
        error={error ?? undefined}
        disabled={busy}
        placeholder="Выберите шаблон или напишите свою формулировку"
        onChange={(e) => onReasonChange(e.target.value)}
      />
    </Modal>
  )
}
