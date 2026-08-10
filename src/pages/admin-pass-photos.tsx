import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AdminPassPhotoThumb } from '@/blocks/admin-pass-photo-thumb'
import { ApiError } from '@/apiClient'
import {
  adminLogout,
  approvePassPhoto,
  educationTrackLabel,
  fetchAdminMe,
  fetchAdminPassPhotoHistory,
  fetchAdminPassPhotoQueue,
  passPhotoStatusLabel,
  rejectPassPhoto,
  retryPassPhotoPerco,
  revertPassPhoto,
  type EducationTrack,
  type PassPhotoAdminItem,
} from '@/pass-photo'
import { paths } from '@/paths'
import { Button, Card, ScreenHeader } from '@/ui'
import styles from './admin-pass-photos.module.css'

function AdminPassPhotoCard({
  item,
  role,
  busyId,
  onApprove,
  onReject,
  onRevert,
  onRetryPerco,
}: {
  item: PassPhotoAdminItem
  role: EducationTrack
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
          <span className={styles.warn}>Предупреждения: {item.validationWarningsJson}</span>
        )}
      </div>
      <AdminPassPhotoThumb
        id={item.id}
        role={role}
        alt={`Фото ${item.studentFullName}`}
        className={styles.thumb}
      />
      <div className={styles.actions}>
        {onApprove && item.status === 'PENDING' && (
          <Button
            type="button"
            disabled={busyId === item.id}
            onClick={() => onApprove(item.id)}
          >
            Принять
          </Button>
        )}
        {onReject && item.status === 'PENDING' && (
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
            disabled={busyId === item.id || syncing}
            onClick={() => onRetryPerco(item.id)}
          >
            Повторить Perco
          </Button>
        )}
        {onRevert && (item.status === 'REJECTED' || item.status === 'PERCO_FAILED') && (
          <Button
            type="button"
            variant="ghost"
            disabled={busyId === item.id}
            onClick={() => onRevert(item.id)}
          >
            Удалить из ЛК
          </Button>
        )}
      </div>
    </Card>
  )
}

type Props = {
  expectedRole: EducationTrack
}

export function AdminPassPhotos({ expectedRole }: Props) {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [username, setUsername] = useState('')
  const [queue, setQueue] = useState<PassPhotoAdminItem[]>([])
  const [history, setHistory] = useState<PassPhotoAdminItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loginPath =
    expectedRole === 'SPO' ? paths.adminPassPhotosSpoLogin : paths.adminPassPhotosHeLogin

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pending, processed] = await Promise.all([
        fetchAdminPassPhotoQueue(expectedRole),
        fetchAdminPassPhotoHistory(expectedRole),
      ])
      setQueue(pending)
      setHistory(processed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить заявки')
      setQueue([])
      setHistory([])
      if (e instanceof ApiError && e.status === 401) {
        setAuthorized(false)
      }
    } finally {
      setLoading(false)
    }
  }, [expectedRole])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const me = await fetchAdminMe(expectedRole)
        if (cancelled) return
        setUsername(me.username)
        setAuthorized(true)
        setReady(true)
        await load()
      } catch {
        if (!cancelled) {
          setAuthorized(false)
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [expectedRole, load])

  const onApprove = async (id: string) => {
    setBusyId(id)
    try {
      await approvePassPhoto(expectedRole, id)
      await load()
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
      await rejectPassPhoto(expectedRole, id, reason.trim())
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отклонения')
    } finally {
      setBusyId(null)
    }
  }

  const onRetryPerco = async (id: string) => {
    setBusyId(id)
    try {
      await retryPassPhotoPerco(expectedRole, id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка повторной загрузки в Perco')
    } finally {
      setBusyId(null)
    }
  }

  const onRevert = async (id: string) => {
    if (!window.confirm('Удалить заявку из ЛК?')) return
    setBusyId(id)
    try {
      await revertPassPhoto(expectedRole, id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    } finally {
      setBusyId(null)
    }
  }

  const onLogout = async () => {
    try {
      await adminLogout(expectedRole)
    } catch {
      /* ignore */
    }
    navigate(loginPath, { replace: true })
  }

  if (!ready) {
    return (
      <div className={styles.page}>
        <p>Проверка сессии…</p>
      </div>
    )
  }

  if (!authorized) {
    return <Navigate to={loginPath} replace />
  }

  const pendingOnly = queue.filter((i) => i.status === 'PENDING')
  const syncingOnly = queue.filter((i) => i.status === 'PERCO_SYNCING')

  return (
    <div className={styles.page}>
      <ScreenHeader
        title={`Админка пропусков — ${educationTrackLabel[expectedRole]}`}
        subtitle={`На проверке: ${pendingOnly.length}${syncingOnly.length ? ` · загрузка в Perco: ${syncingOnly.length}` : ''} · ${username}`}
      />
      <div className={styles.toolbar}>
        <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
          Обновить
        </Button>
        <Button type="button" variant="ghost" onClick={() => void onLogout()}>
          Выйти
        </Button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {loading && <p>Загрузка…</p>}

      <h2 className={styles.sectionTitle}>На проверке</h2>
      <div className={styles.grid}>
        {pendingOnly.map((item) => (
          <AdminPassPhotoCard
            key={item.id}
            item={item}
            role={expectedRole}
            busyId={busyId}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
        {syncingOnly.map((item) => (
          <AdminPassPhotoCard key={item.id} item={item} role={expectedRole} busyId={busyId} />
        ))}
        {!loading && pendingOnly.length === 0 && syncingOnly.length === 0 && (
          <p>Нет заявок на проверке.</p>
        )}
      </div>

      <h2 className={styles.sectionTitle}>Обработанные</h2>
      <div className={styles.grid}>
        {history.map((item) => (
          <AdminPassPhotoCard
            key={item.id}
            item={item}
            role={expectedRole}
            busyId={busyId}
            onRetryPerco={onRetryPerco}
            onRevert={onRevert}
          />
        ))}
        {!loading && history.length === 0 && <p>История пуста.</p>}
      </div>
    </div>
  )
}

export function AdminPassPhotosSpo() {
  return <AdminPassPhotos expectedRole="SPO" />
}

export function AdminPassPhotosHe() {
  return <AdminPassPhotos expectedRole="HE" />
}
