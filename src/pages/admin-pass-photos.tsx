import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, Search } from 'lucide-react'
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
import {
  countByStatus,
  filterHistoryItems,
  filterQueueItems,
  type HistoryFilter,
  type QueueFilter,
} from '@/pages/admin-pass-photo-filters'
import { paths } from '@/paths'
import { AdminPassPhotoRejectModal } from '@/pages/admin-pass-photo-reject-modal'
import { AdminPassPhotoShell } from '@/pages/admin-pass-photo-shell'
import { Badge, Button, Lightbox, Loader } from '@/ui'
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
  onPhotoOpen,
}: {
  item: PassPhotoAdminItem
  role: EducationTrack
  busyId: string | null
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRevert?: (id: string) => void
  onRetryPerco?: (id: string) => void
  onPhotoOpen?: (payload: { src: string; alt: string; caption: string }) => void
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
            onOpen={
              onPhotoOpen
                ? (src) =>
                    onPhotoOpen({
                      src,
                      alt: `Фото ${item.studentFullName}`,
                      caption: `${item.studentFullName} · зачётка ${item.zachetka || item.studentId}`,
                    })
                : undefined
            }
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={[styles.filterChip, active ? styles.filterChipActive : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {children}
    </button>
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
  const [search, setSearch] = useState('')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all')
  const [rejectItem, setRejectItem] = useState<PassPhotoAdminItem | null>(null)
  const [lightbox, setLightbox] = useState<{
    src: string
    alt: string
    caption: string
  } | null>(null)

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

  const onReject = (id: string) => {
    const item = queue.find((i) => i.id === id)
    if (item) setRejectItem(item)
  }

  const onRejectConfirm = async (reason: string) => {
    if (!rejectItem) return
    setBusyId(rejectItem.id)
    try {
      await rejectPassPhoto(expectedRole, rejectItem.id, reason)
      setRejectItem(null)
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

  const pendingTotal = countByStatus(queue, 'PENDING')
  const syncingTotal = countByStatus(queue, 'PERCO_SYNCING')
  const syncedTotal = countByStatus(history, 'PERCO_SYNCED')
  const rejectedTotal = countByStatus(history, 'REJECTED')
  const failedTotal = countByStatus(history, 'PERCO_FAILED')

  const filteredQueue = useMemo(
    () => filterQueueItems(queue, search, queueFilter),
    [queue, search, queueFilter],
  )
  const filteredHistory = useMemo(
    () => filterHistoryItems(history, search, historyFilter),
    [history, search, historyFilter],
  )

  const filteredPending = filteredQueue.filter((i) => i.status === 'PENDING')
  const filteredSyncing = filteredQueue.filter((i) => i.status === 'PERCO_SYNCING')
  const hasActiveFilters = search.trim() !== '' || queueFilter !== 'all' || historyFilter !== 'all'

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
          <span className={styles.statValue}>{pendingTotal}</span>
          <span className={styles.statLabel}>На проверке</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{syncingTotal}</span>
          <span className={styles.statLabel}>Загрузка в Perco</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{history.length}</span>
          <span className={styles.statLabel}>В истории</span>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchRow}>
          <div className={styles.searchField}>
            <label className={styles.filterLabel} htmlFor="admin-pass-photo-search">
              Поиск
            </label>
            <div className={styles.searchInputWrap}>
              <Search size={16} className={styles.searchIcon} aria-hidden />
              <input
                id="admin-pass-photo-search"
                className={styles.searchInput}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ФИО или номер зачётки"
                autoComplete="off"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch('')
                setQueueFilter('all')
                setHistoryFilter('all')
              }}
            >
              Сбросить фильтры
            </Button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Очередь</span>
          <div className={styles.filterChips}>
            <FilterChip active={queueFilter === 'all'} onClick={() => setQueueFilter('all')}>
              Все ({pendingTotal + syncingTotal})
            </FilterChip>
            <FilterChip active={queueFilter === 'pending'} onClick={() => setQueueFilter('pending')}>
              На проверке ({pendingTotal})
            </FilterChip>
            <FilterChip active={queueFilter === 'syncing'} onClick={() => setQueueFilter('syncing')}>
              В Perco ({syncingTotal})
            </FilterChip>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>История</span>
          <div className={styles.filterChips}>
            <FilterChip active={historyFilter === 'all'} onClick={() => setHistoryFilter('all')}>
              Все ({history.length})
            </FilterChip>
            <FilterChip
              active={historyFilter === 'PERCO_SYNCED'}
              onClick={() => setHistoryFilter('PERCO_SYNCED')}
            >
              Принято ({syncedTotal})
            </FilterChip>
            <FilterChip
              active={historyFilter === 'REJECTED'}
              onClick={() => setHistoryFilter('REJECTED')}
            >
              Отклонено ({rejectedTotal})
            </FilterChip>
            <FilterChip
              active={historyFilter === 'PERCO_FAILED'}
              onClick={() => setHistoryFilter('PERCO_FAILED')}
            >
              Ошибка Perco ({failedTotal})
            </FilterChip>
          </div>
        </div>

        {hasActiveFilters && (
          <p className={styles.filtersHint}>
            Показано: {filteredQueue.length} в очереди, {filteredHistory.length} в истории
          </p>
        )}
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
                {filteredPending.length + filteredSyncing.length}
              </span>
            </div>
            <div className={styles.grid}>
              {filteredPending.map((item) => (
                <AdminPassPhotoCard
                  key={item.id}
                  item={item}
                  role={expectedRole}
                  busyId={busyId}
                  onApprove={onApprove}
                  onReject={onReject}
                  onPhotoOpen={setLightbox}
                />
              ))}
              {filteredSyncing.map((item) => (
                <AdminPassPhotoCard
                  key={item.id}
                  item={item}
                  role={expectedRole}
                  busyId={busyId}
                  onPhotoOpen={setLightbox}
                />
              ))}
              {!loading && filteredPending.length === 0 && filteredSyncing.length === 0 && (
                <EmptyBlock
                  title={hasActiveFilters ? 'Ничего не найдено' : 'Очередь пуста'}
                  hint={
                    hasActiveFilters
                      ? 'Измените поиск или фильтры очереди.'
                      : 'Новые заявки появятся здесь, когда студенты отправят фото.'
                  }
                />
              )}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Обработанные</h2>
              <span className={styles.sectionCount}>{filteredHistory.length}</span>
            </div>
            <div className={styles.grid}>
              {filteredHistory.map((item) => (
                <AdminPassPhotoCard
                  key={item.id}
                  item={item}
                  role={expectedRole}
                  busyId={busyId}
                  onRetryPerco={onRetryPerco}
                  onRevert={onRevert}
                  onPhotoOpen={setLightbox}
                />
              ))}
              {!loading && filteredHistory.length === 0 && (
                <EmptyBlock
                  title={hasActiveFilters ? 'Ничего не найдено' : 'История пуста'}
                  hint={
                    hasActiveFilters
                      ? 'Измените поиск или фильтры истории.'
                      : 'Здесь будут принятые и отклонённые заявки.'
                  }
                />
              )}
            </div>
          </section>
        </>
      )}

      <AdminPassPhotoRejectModal
        open={rejectItem !== null}
        studentName={rejectItem?.studentFullName ?? ''}
        zachetka={rejectItem?.zachetka || rejectItem?.studentId || ''}
        busy={rejectItem !== null && busyId === rejectItem.id}
        onClose={() => setRejectItem(null)}
        onConfirm={onRejectConfirm}
      />

      <Lightbox
        open={lightbox !== null}
        src={lightbox?.src ?? null}
        alt={lightbox?.alt ?? ''}
        caption={lightbox?.caption}
        onClose={() => setLightbox(null)}
      />
    </AdminPassPhotoShell>
  )
}

export function AdminPassPhotosSpo() {
  return <AdminPassPhotos expectedRole="SPO" />
}

export function AdminPassPhotosHe() {
  return <AdminPassPhotos expectedRole="HE" />
}
