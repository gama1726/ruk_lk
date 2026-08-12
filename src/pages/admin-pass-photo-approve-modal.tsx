import { Button, Modal } from '@/ui'
import styles from './admin-pass-photo-reject-modal.module.css'

type Props = {
  open: boolean
  studentName: string
  zachetka: string
  busy?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

export function AdminPassPhotoApproveModal({
  open,
  studentName,
  zachetka,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      open={open}
      title="Принять заявку"
      onClose={busy ? () => {} : onClose}
      footer={
        <div className={styles.footerActions}>
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
            Отмена
          </Button>
          <Button type="button" disabled={busy} onClick={() => void onConfirm()}>
            Принять
          </Button>
        </div>
      }
    >
      <p className={styles.studentHint}>
        Студент: <strong>{studentName}</strong>
        {zachetka ? <> · зачётка {zachetka}</> : null}
      </p>
      <p className={styles.confirmText}>
        Фото будет отправлено в систему пропуска Perco. Студент увидит статус загрузки, пока
        интеграция не завершится.
      </p>
    </Modal>
  )
}
