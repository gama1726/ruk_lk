import { useCallback, useEffect, useState } from 'react'
import { AdminPassPhotoThumb } from '@/blocks/admin-pass-photo-thumb'
import {
  approvePassPhoto,
  fetchAdminPassPhotoHistory,
  fetchAdminPassPhotoQueue,
  passPhotoStatusLabel,
  rejectPassPhoto,
  retryPassPhotoPerco,
  revertPassPhoto,
  type PassPhotoAdminItem,
} from '@/pass-photo'
import { Button, Card, ScreenHeader } from '@/ui'
import styles from './admin-pass-photos.module.css'

const TOKEN_KEY = 'ruk_lk_admin_token'

function AdminPassPhotoCard({
  item,
  token,
  busyId,
  onApprove,
  onReject,
  onRevert,
  onRetryPerco,
}: {
  item: PassPhotoAdminItem
  token: string
  busyId: string | null
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRevert?: (id: string) => void
  onRetryPerco?: (id: string) => void
}) {
  const syncing = item.status === 'PERCO_SYNCING'
  const failed = item.status === 'PERCO_FAILED'

  return (
    <Card padding="md" className={styles.card}>
      <div className={styles.meta}>
        <strong>{item.studentFullName}</strong>
        <span>Зачётка: {item.zachetka || item.studentId}</span>
        <span>
          Статус: <strong>{passPhotoStatusLabel[item.status]}</strong>
        </span>
        <span>Отправлено: {new Date(item.submittedAt).toLocaleString('ru-RU')}</span>
        {item.reviewedAt && (
          <span>Обработано: {new Date(item.reviewedAt).toLocaleString('ru-RU')}</span>
        )}
        {item.rejectReason && <span className={styles.warn}>Причина: {item.rejectReason}</span>}
        {item.percoError && <span className={styles.warn}>Perco: {item.percoError}</span>}
        {item.validationWarningsJson && (
          <span className={styles.warn}>⚠ {item.validationWarningsJson.replace(/\n/g, '; ')}</span>
        )}
        {syncing && (
          <span className={styles.warn}>
            Идёт загрузка в Perco. Если зависло — обновите страницу после рестарта API или повторите из истории.
          </span>
        )}
      </div>
      <AdminPassPhotoThumb
        className={styles.photo}
        id={item.id}
        token={token}
        alt={item.studentFullName}
      />
      <div className={styles.actions}>
        {onApprove && !syncing && (
          <Button
            type="button"
            disabled={busyId === item.id}
            onClick={() => onApprove(item.id)}
          >
            Одобрить и в Perco
          </Button>
        )}
        {onReject && !syncing && (
          <Button
            type="button"
            variant="secondary"
            disabled={busyId === item.id}
            onClick={() => onReject(item.id)}
          >
            Отклонить
          </Button>
        )}
        {onRetryPerco && failed && (
          <Button
            type="button"
            disabled={busyId === item.id}
            onClick={() => onRetryPerco(item.id)}
          >
            Повторить Perco
          </Button>
        )}
        {onRevert && (
          <Button
            type="button"
            variant="secondary"
            disabled={busyId === item.id}
            onClick={() => onRevert(item.id)}
          >
            Сбросить
          </Button>
        )}
      </div>
    </Card>
  )
}

export function AdminPassPhotos() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '')
  const [tokenInput, setTokenInput] = useState('')
  const [queue, setQueue] = useState<PassPhotoAdminItem[]>([])
  const [history, setHistory] = useState<PassPhotoAdminItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (authToken: string) => {
    if (!authToken) return
    setLoading(true)
    setError(null)
    try {
      const [pending, processed] = await Promise.all([
        fetchAdminPassPhotoQueue(authToken),
        fetchAdminPassPhotoHistory(authToken),
      ])
      setQueue(pending)
      setHistory(processed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заявки')
      setQueue([])
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) void load(token)
  }, [token, load])

  const saveToken = () => {
    const trimmed = tokenInput.trim()
    sessionStorage.setItem(TOKEN_KEY, trimmed)
    setToken(trimmed)
    void load(trimmed)
  }

  const onApprove = async (id: string) => {
    setBusyId(id)
    try {
      await approvePassPhoto(token, id)
      await load(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка одобрения')
    } finally {
      setBusyId(null)
    }
  }

  const onReject = async (id: string) => {
    const reason = window.prompt('Причина отклонения:', 'Фото не соответствует требованиям') ?? ''
    if (!reason.trim()) return
    setBusyId(id)
    try {
      await rejectPassPhoto(token, id, reason.trim())
      await load(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отклонения')
    } finally {
      setBusyId(null)
    }
  }

  const onRetryPerco = async (id: string) => {
    setBusyId(id)
    try {
      await retryPassPhotoPerco(token, id)
      await load(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка повторной загрузки в Perco')
    } finally {
      setBusyId(null)
    }
  }

  const onRevert = async (id: string) => {
    const ok = window.confirm(
      'Сбросить заявку в ЛК? Файл будет удалён, студент сможет загрузить фото заново. Фото в Perco (если было) не меняется.',
    )
    if (!ok) return
    setBusyId(id)
    try {
      await revertPassPhoto(token, id)
      await load(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отката')
    } finally {
      setBusyId(null)
    }
  }

  if (!token) {
    return (
      <>
        <ScreenHeader title="Модерация фото для пропуска" subtitle="Только для сотрудников" />
        <Card padding="lg" className={styles.auth}>
          <label className={styles.label}>
            Токен администратора
            <input
              className={styles.input}
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="app.admin.api-token"
            />
          </label>
          <Button type="button" onClick={saveToken}>
            Войти
          </Button>
        </Card>
      </>
    )
  }

  const pendingOnly = queue.filter((i) => i.status === 'PENDING')
  const syncingOnly = queue.filter((i) => i.status === 'PERCO_SYNCING')

  return (
    <>
      <ScreenHeader
        title="Модерация фото для пропуска"
        subtitle={`На проверке: ${pendingOnly.length}${syncingOnly.length ? ` · загрузка в Perco: ${syncingOnly.length}` : ''}`}
      />

      {error && <p className={styles.error}>{error}</p>}
      {loading && <p>Загрузка…</p>}

      <h2 className={styles.sectionTitle}>На проверке</h2>
      <ul className={styles.list}>
        {queue.map((item) => (
          <li key={item.id}>
            <AdminPassPhotoCard
              item={item}
              token={token}
              busyId={busyId}
              onApprove={item.status === 'PENDING' ? onApprove : undefined}
              onReject={item.status === 'PENDING' ? onReject : undefined}
            />
          </li>
        ))}
      </ul>

      {!loading && queue.length === 0 && (
        <Card padding="lg">
          <p>Нет заявок на проверке.</p>
        </Card>
      )}

      <h2 className={styles.sectionTitle}>Обработанные заявки</h2>
      <p className={styles.sectionHint}>
        При ошибке Perco можно повторить загрузку. «Сбросить» доступен для отклонённых и ошибок Perco —
        удаляет заявку в ЛК. Принятые (в Perco) сбросить нельзя: студент загрузит новое по лимиту 3 дня.
      </p>
      <ul className={styles.list}>
        {history.map((item) => (
          <li key={item.id}>
            <AdminPassPhotoCard
              item={item}
              token={token}
              busyId={busyId}
              onRetryPerco={item.status === 'PERCO_FAILED' ? onRetryPerco : undefined}
              onRevert={
                item.status === 'REJECTED' || item.status === 'PERCO_FAILED'
                  ? onRevert
                  : undefined
              }
            />
          </li>
        ))}
      </ul>

      {!loading && history.length === 0 && (
        <Card padding="lg">
          <p>Нет обработанных заявок.</p>
        </Card>
      )}

      <p className={styles.footer}>
        <button type="button" className={styles.linkBtn} onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken('') }}>
          Сменить токен
        </button>
      </p>
    </>
  )
}
