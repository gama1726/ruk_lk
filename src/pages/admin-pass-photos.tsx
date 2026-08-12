import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { RefreshCw, LogOut } from 'lucide-react'
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
  type PassPhotoStatus,
} from '@/pass-photo'
import { paths } from '@/paths'
import { AdminPassPhotoShell } from '@/pages/admin-pass-photo-shell'
import { Badge, Button, Loader } from '@/ui'
import type { BadgeProps } from '@/ui/Badge/Badge'
import styles from './admin-pass-photos.module.css'

function statusBadgeVariant(status: PassPhotoStatus): BadgeProps['variant'] {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'PERCO_SYNCING':
      return 'info'
    case 'PERCO_SYNCED':
      return 'success'
    case 'REJECTED':
    case 'PERCO_FAILED':
      return 'danger'
    default:
      return 'default'
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
  const busy = busyId === item.id

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.studentName}>{item.studentFullName}</h3>
          <p className={styles.zachetka}>Зачётка {item.zachetka || item.studentId}</p>
        </div>
        <Badge variant={statusBadgeVariant(item.status)}>
          {passPhotoStatusLabel[item.status]}
        </Badge>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.meta}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Отправлено</span>
            <span className={styles.metaValue}>{formatDateTime(item.submittedAt)}</span>
          </div>
          {item.reviewedAt && (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Обработано</span>
              <span className={styles.metaValue}>{formatDateTime(item.reviewedAt)}</span>
            </div>
          )}
          {item.rejectReason && (
            <p className={styles.warnBlock}>Причина отклонения: {item.rejectReason}</p>
          )}
          {item.percoError && (
            <p className={styles.warnBlock}>Ошибка Perco: {item.percoError}</p>
          )}
          {item.validationWarningsJson && (
            <p className={styles.warnBlock}>Предупреждения: {item.validationWarningsJson}</p>
          )}
        </div>

        <div className={styles.photoWrap}>
          <AdminPassPhotoThumb
            id={item.id}
            role={role}
            alt={`Фото ${item.studentFullName}`}
            className={styles.thumb}
          />
        </div>
      </div>

      {(onApprove || onReject || onRetryPerco || onRevert) && (
        <div className={styles.actions}>
          {onApprove && item.status === 'PENDING' && (
            <Button type="button" disabled={busy} onClick={() => onApprove(item.id)}>
              Принять
            </Button>
          )}
          {onReject && item.status === 'PENDING' && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => onReject(item.id)}
            >
              Отклонить
            </Button>
          )}
          {onRetryPerco && failed && (
            <Button
              type="button"
              disabled={busy || syncing}
              onClick={() => onRetryPerco(item.id)}
            >
              Повторить Perco
            </Button>
          )}
          {onRevert && (item.status === 'REJECTED' || item.status === 'PERCO_FAILED') && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => onRevert(item.id)}
            >
              Удалить из ЛК
            </Button>
          )}
        </div>
      )}
    </article>
  )
}

function EmptyBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      <p>{hint}</p>
    </div>
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

  const loginPath = paths.adminPassPhotosLogin

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
      <AdminPassPhotoShell track={expectedRole} pageSection="Проверка">
        <div className={styles.loadingWrap}>
          <Loader text="Проверка сессии…" />
        </div>
      </AdminPassPhotoShell>
    )
  }

  if (!authorized) {
    return <Navigate to={loginPath} replace />
  }

  const pendingOnly = queue.filter((i) => i.status === 'PENDING')
  const syncingOnly = queue.filter((i) => i.status === 'PERCO_SYNCING')

  return (
    <AdminPassPhotoShell track={expectedRole} pageSection="Очередь">
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Очередь заявок</h1>
          <p className={styles.pageSubtitle}>
            {educationTrackLabel[expectedRole]} · сотрудник <strong>{username}</strong>
          </p>
        </div>
        <div className={styles.toolbar}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={16} aria-hidden />
            Обновить
          </Button>
          <Button type="button" variant="ghost" onClick={() => void onLogout()}>
            <LogOut size={16} aria-hidden />
            Выйти
          </Button>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
          <span className={styles.statValue}>{pendingOnly.length}</span>
          <span className={styles.statLabel}>На проверке</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{syncingOnly.length}</span>
          <span className={styles.statLabel}>Загрузка в Perco</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{history.length}</span>
          <span className={styles.statLabel}>В истории</span>
        </div>
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {loading && queue.length === 0 && history.length === 0 ? (
        <div className={styles.loadingWrap}>
          <Loader text="Загрузка заявок…" />
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>На проверке</h2>
              <span className={styles.sectionCount}>
                {pendingOnly.length + syncingOnly.length}
              </span>
            </div>
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
                <AdminPassPhotoCard
                  key={item.id}
                  item={item}
                  role={expectedRole}
                  busyId={busyId}
                />
              ))}
              {!loading && pendingOnly.length === 0 && syncingOnly.length === 0 && (
                <EmptyBlock
                  title="Очередь пуста"
                  hint="Новые заявки появятся здесь, когда студенты отправят фото."
                />
              )}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Обработанные</h2>
              <span className={styles.sectionCount}>{history.length}</span>
            </div>
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
              {!loading && history.length === 0 && (
                <EmptyBlock
                  title="История пуста"
                  hint="Здесь будут принятые и отклонённые заявки."
                />
              )}
            </div>
          </section>
        </>
      )}
    </AdminPassPhotoShell>
  )
}

export function AdminPassPhotosSpo() {
  return <AdminPassPhotos expectedRole="SPO" />
}

export function AdminPassPhotosHe() {
  return <AdminPassPhotos expectedRole="HE" />
}
