/**
 * @file Очередь справок по кампусу — редизайн: счётчики, вкладки, карточки, drawer.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError, apiGetBlob } from '@/apiClient'
import {
  approveCertificate,
  certificateStatusLabel,
  getAdminCertificate,
  rejectCertificate,
  type CertificateAttachment,
  type CertificateRequest,
} from '@/certificates'
import {
  getCertificateSettings,
  listCertificateRequests,
  updateCertificateSettings,
  type AbsenceReportCampus,
  type CertificateRequestSummary,
  type CertificateSettings,
} from '@/lk-admin'
import { Button, Loader, LoadError, Modal } from '@/ui'
import styles from './admin-lk-certificates.module.css'

const CAMPUS_LABEL: Record<AbsenceReportCampus, string> = {
  KAZAN: 'Казань',
  KRASNODAR: 'Краснодар',
  HEAD: 'Голова',
}

const REJECT_PRESETS = [
  'Неверный тип справки',
  'Нечитаемый документ',
  'Некорректные даты',
  'Документ не подтверждает указанный период',
  'Недостаточно информации',
  'Другая причина',
] as const

type TabId = 'all' | 'pending' | 'processed'

function parseCampus(raw: string | undefined): AbsenceReportCampus | null {
  const value = (raw ?? '').trim().toUpperCase()
  if (value === 'KAZAN' || value === 'KRASNODAR' || value === 'HEAD') return value
  return null
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'APPROVED'
      ? styles.badgeApproved
      : status === 'REJECTED'
        ? styles.badgeRejected
        : status === 'CANCELLED'
          ? styles.badgeCancelled
          : styles.badgePending
  return <span className={`${styles.badge} ${cls}`}>{certificateStatusLabel(status)}</span>
}

function dayCount(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) return null
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return null
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1
}

function isImageAttachment(a: CertificateAttachment): boolean {
  return (a.contentType || '').startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(a.originalFilename)
}

function isPdfAttachment(a: CertificateAttachment): boolean {
  return (a.contentType || '').includes('pdf') || /\.pdf$/i.test(a.originalFilename)
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} Б`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`
}

export function AdminLkCertificatesPage() {
  const { campus: campusParam } = useParams()
  const campus = useMemo(() => parseCampus(campusParam), [campusParam])

  const [items, setItems] = useState<CertificateRequestSummary[]>([])
  const [settings, setSettings] = useState<CertificateSettings | null>(null)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [tab, setTab] = useState<TabId>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CertificateRequest | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewKind, setPreviewKind] = useState<'image' | 'pdf' | null>(null)
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectPreset, setRejectPreset] = useState<string>(REJECT_PRESETS[0])
  const [rejectComment, setRejectComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }

  const load = useCallback(async () => {
    if (!campus) return
    setLoading(true)
    setError(null)
    setSaveMsg(null)
    try {
      const [list, cfg] = await Promise.all([
        listCertificateRequests(campus),
        getCertificateSettings(campus),
      ])
      setItems(list)
      setSettings(cfg)
      setNotifyEmail(cfg.notifyEmail ?? '')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить очередь справок')
    } finally {
      setLoading(false)
    }
  }, [campus])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const counts = useMemo(() => {
    const pending = items.filter((i) => i.status === 'PENDING').length
    const approved = items.filter((i) => i.status === 'APPROVED').length
    const rejected = items.filter((i) => i.status === 'REJECTED').length
    return { pending, approved, rejected, total: items.length }
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((item) => {
        if (tab === 'pending') return item.status === 'PENDING'
        if (tab === 'processed') return item.status === 'APPROVED' || item.status === 'REJECTED'
        return true
      })
      .filter((item) => {
        if (!q) return true
        return (
          item.studentFullName.toLowerCase().includes(q) ||
          item.studentId.toLowerCase().includes(q) ||
          (item.group ?? '').toLowerCase().includes(q)
        )
      })
  }, [items, tab, query])

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewKind(null)
    setPreviewAttachmentId(null)
  }

  const openRequest = async (id: string) => {
    if (!campus) return
    setActionError(null)
    setActing(true)
    clearPreview()
    try {
      const detail = await getAdminCertificate(campus, id)
      setSelected(detail)
      setFrom(detail.approvedFrom ?? '')
      setTo(detail.approvedTo ?? '')
      setRejectPreset(REJECT_PRESETS[0])
      setRejectComment('')
      const first = detail.attachments[0]
      if (first) await loadPreview(campus, detail.id, first)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось открыть заявку')
    } finally {
      setActing(false)
    }
  }

  const loadPreview = async (
    campusValue: AbsenceReportCampus,
    requestId: string,
    attachment: CertificateAttachment,
  ) => {
    clearPreview()
    if (!isImageAttachment(attachment) && !isPdfAttachment(attachment)) return
    try {
      const path = `/api/admin/lk/certificates/${campusValue.toLowerCase()}/requests/${requestId}/attachments/${attachment.id}`
      const { blob } = await apiGetBlob(path)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPreviewKind(isPdfAttachment(attachment) ? 'pdf' : 'image')
      setPreviewAttachmentId(attachment.id)
    } catch {
      // превью необязательно
    }
  }

  const downloadAttachment = async (attachment: CertificateAttachment) => {
    if (!campus || !selected) return
    try {
      const path = `/api/admin/lk/certificates/${campus.toLowerCase()}/requests/${selected.id}/attachments/${attachment.id}`
      const { blob, filename } = await apiGetBlob(path)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || attachment.originalFilename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось скачать')
    }
  }

  const saveSettings = async () => {
    if (!campus) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const next = await updateCertificateSettings(campus, {
        notifyEmail: notifyEmail.trim() || null,
      })
      setSettings(next)
      setNotifyEmail(next.notifyEmail ?? '')
      setSaveMsg('Сохранено')
      showToast('Настройки уведомлений сохранены')
    } catch (err) {
      setSaveMsg(err instanceof ApiError ? err.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const nextPendingAfter = (currentId: string) => {
    const pending = items.filter((i) => i.status === 'PENDING' && i.id !== currentId)
    return pending[0]?.id ?? null
  }

  const onApprove = async () => {
    if (!campus || !selected) return
    setActionError(null)
    setActing(true)
    try {
      const id = selected.id
      const next = await approveCertificate(campus, id, from, to)
      setSelected(next)
      setApproveOpen(false)
      await load()
      showToast('Заявка одобрена')
      const following = nextPendingAfter(id)
      if (following) await openRequest(following)
      else {
        setSelected(null)
        clearPreview()
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось одобрить')
    } finally {
      setActing(false)
    }
  }

  const onReject = async () => {
    if (!campus || !selected) return
    const reason =
      rejectPreset === 'Другая причина'
        ? rejectComment.trim()
        : rejectComment.trim()
          ? `${rejectPreset}. ${rejectComment.trim()}`
          : rejectPreset
    if (!reason) {
      setActionError('Укажите причину отклонения')
      return
    }
    setActionError(null)
    setActing(true)
    try {
      const id = selected.id
      const next = await rejectCertificate(campus, id, reason)
      setSelected(next)
      setRejectOpen(false)
      await load()
      showToast('Заявка отклонена')
      const following = nextPendingAfter(id)
      if (following) await openRequest(following)
      else {
        setSelected(null)
        clearPreview()
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось отклонить')
    } finally {
      setActing(false)
    }
  }

  if (!campus) {
    return <LoadError message="Неизвестный кампус. Откройте Казань, Краснодар или Голову." />
  }

  if (loading) return <Loader />
  if (error) return <LoadError message={error} onRetry={() => void load()} />

  const approveDays = dayCount(from, to)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Справки · {CAMPUS_LABEL[campus]}</h1>
          <p className={styles.subtitle}>Проверка документов и причин отсутствия студентов</p>
        </div>
        <Button
          type="button"
          className={styles.refreshBtn}
          variant="secondary"
          onClick={() => void load()}
          disabled={saving || acting}
        >
          Обновить
        </Button>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>На проверке</p>
          <p className={`${styles.statValue} ${styles.statPending}`}>{counts.pending}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Одобрено</p>
          <p className={`${styles.statValue} ${styles.statApproved}`}>{counts.approved}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Отклонено</p>
          <p className={`${styles.statValue} ${styles.statRejected}`}>{counts.rejected}</p>
        </div>
      </div>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Заявки</h2>
        <button
          type="button"
          className={styles.iconBtn}
          title="Настройки уведомлений"
          aria-label="Настройки уведомлений"
          onClick={() => setShowSettings((v) => !v)}
        >
          ⚙
        </button>
      </div>

      {showSettings ? (
        <div className={styles.settingsCard}>
          <h3 className={styles.sectionTitle}>Уведомления о новых заявках</h3>
          <p className={styles.cardMeta}>
            Если указать email — при новой заявке уйдёт письмо. Пустое поле — только очередь в панели.
          </p>
          <div className={styles.settingsRow}>
            <input
              className={styles.settingsInput}
              type="email"
              placeholder="notify@example.ru"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              disabled={saving}
            />
            <Button type="button" onClick={() => void saveSettings()} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
            <span className={styles.cardMeta}>
              {settings?.notifyEmail ? 'Письма включены' : 'Письма выключены'}
            </span>
            {saveMsg ? <span className={styles.cardMeta}>{saveMsg}</span> : null}
          </div>
        </div>
      ) : null}

      <div className={styles.tabs}>
        {(
          [
            ['all', 'Все'],
            ['pending', 'На проверке'],
            ['processed', 'Обработанные'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        className={styles.search}
        type="search"
        placeholder="Поиск по ФИО, зачётке или группе"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✓</div>
          <p className={styles.emptyTitle}>
            {tab === 'pending' ? 'Все заявки проверены' : 'Заявок не найдено'}
          </p>
          <p className={styles.emptyText}>
            {tab === 'pending' ? 'Новых заявок пока нет' : 'Измените вкладку или поисковый запрос'}
          </p>
        </div>
      ) : (
        <ul className={styles.list}>
          {filtered.map((item) => (
            <li key={item.id} className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardName}>{item.studentFullName || item.studentId}</h3>
                <StatusBadge status={item.status} />
              </div>
              <p className={styles.cardMeta}>
                {item.typeLabel} · Зачётка {item.studentId}
                {item.group ? ` · ${item.group}` : ''}
              </p>
              <p className={styles.cardMeta}>
                Подано: {new Date(item.createdAt).toLocaleString('ru-RU')}
              </p>
              {item.status === 'APPROVED' && item.approvedFrom && item.approvedTo ? (
                <p className={styles.cardMeta}>
                  Период: {item.approvedFrom} — {item.approvedTo}
                  {dayCount(item.approvedFrom, item.approvedTo)
                    ? ` · ${dayCount(item.approvedFrom, item.approvedTo)} дн.`
                    : ''}
                </p>
              ) : null}
              {item.status === 'REJECTED' && item.rejectionReason ? (
                <p className={styles.cardReason}>{item.rejectionReason}</p>
              ) : null}
              <div className={styles.cardFooter}>
                <Button type="button" size="sm" onClick={() => void openRequest(item.id)} disabled={acting}>
                  Открыть
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && campus ? (
        <div
          className={styles.drawerOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null)
              clearPreview()
            }
          }}
        >
          <aside className={styles.drawer} role="dialog" aria-modal="true">
            <div className={styles.drawerHead}>
              <div>
                <h2 className={styles.drawerTitle}>{selected.studentFullName}</h2>
                <div style={{ marginTop: 6 }}>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelected(null)
                  clearPreview()
                }}
              >
                Закрыть
              </Button>
            </div>

            <div className={styles.drawerBody}>
              <section>
                <h3 className={styles.blockTitle}>Студент</h3>
                <p className={styles.kv}>
                  <strong>Зачётка:</strong> {selected.studentId}
                </p>
                {selected.group ? (
                  <p className={styles.kv}>
                    <strong>Группа:</strong> {selected.group}
                  </p>
                ) : null}
                {selected.faculty ? (
                  <p className={styles.kv}>
                    <strong>Факультет:</strong> {selected.faculty}
                  </p>
                ) : null}
                {selected.department ? (
                  <p className={styles.kv}>
                    <strong>Подразделение:</strong> {selected.department}
                  </p>
                ) : null}
                {selected.course ? (
                  <p className={styles.kv}>
                    <strong>Курс:</strong> {selected.course}
                  </p>
                ) : null}
              </section>

              <section>
                <h3 className={styles.blockTitle}>Заявка</h3>
                <p className={styles.kv}>
                  <strong>Тип:</strong> {selected.typeLabel}
                </p>
                <p className={styles.kv}>
                  <strong>Подана:</strong> {new Date(selected.createdAt).toLocaleString('ru-RU')}
                </p>
                {selected.comment ? (
                  <p className={styles.kv}>
                    <strong>Комментарий:</strong> {selected.comment}
                  </p>
                ) : null}
                {selected.approvedFrom && selected.approvedTo ? (
                  <p className={styles.kv}>
                    <strong>Период:</strong> {selected.approvedFrom} — {selected.approvedTo}
                    {dayCount(selected.approvedFrom, selected.approvedTo)
                      ? ` (${dayCount(selected.approvedFrom, selected.approvedTo)} дн.)`
                      : ''}
                  </p>
                ) : (
                  <p className={styles.kv}>
                    <strong>Период:</strong> укажет администратор при одобрении
                  </p>
                )}
                {selected.reviewedAt ? (
                  <p className={styles.kv}>
                    <strong>Обработана:</strong> {new Date(selected.reviewedAt).toLocaleString('ru-RU')}
                    {selected.reviewedBy ? ` · ${selected.reviewedBy}` : ''}
                  </p>
                ) : null}
                {selected.rejectionReason ? (
                  <p className={styles.cardReason}>Причина: {selected.rejectionReason}</p>
                ) : null}
              </section>

              <section>
                <h3 className={styles.blockTitle}>Документы</h3>
                {selected.attachments.length === 0 ? (
                  <p className={styles.cardMeta}>Файлы удалены или отсутствуют</p>
                ) : (
                  selected.attachments.map((a) => (
                    <div key={a.id} className={styles.fileRow}>
                      <p className={styles.kv}>
                        <strong>{a.originalFilename}</strong>
                      </p>
                      <p className={styles.cardMeta}>
                        {a.contentType || 'файл'} · {formatBytes(a.sizeBytes)}
                      </p>
                      {previewUrl && previewKind === 'image' && previewAttachmentId === a.id ? (
                        <img src={previewUrl} alt="" className={styles.preview} />
                      ) : null}
                      {previewUrl && previewKind === 'pdf' && previewAttachmentId === a.id ? (
                        <iframe title="PDF" src={previewUrl} className={styles.pdfFrame} />
                      ) : null}
                      <div className={styles.fileActions}>
                        {(isImageAttachment(a) || isPdfAttachment(a)) && previewAttachmentId !== a.id ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => void loadPreview(campus, selected.id, a)}
                          >
                            Просмотр
                          </Button>
                        ) : null}
                        <Button type="button" size="sm" onClick={() => void downloadAttachment(a)}>
                          Скачать
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </section>

              {selected.status === 'PENDING' ? (
                <section>
                  <h3 className={styles.blockTitle}>Решение</h3>
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      Дата начала отсутствия
                      <input
                        className={styles.input}
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        disabled={acting}
                      />
                    </label>
                    <label className={styles.field}>
                      Дата окончания
                      <input
                        className={styles.input}
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        disabled={acting}
                      />
                    </label>
                    {approveDays ? (
                      <p className={styles.cardMeta}>Календарных дней: {approveDays}</p>
                    ) : null}
                  </div>
                  <div className={styles.drawerActions}>
                    <Button
                      type="button"
                      disabled={acting || !from || !to}
                      onClick={() => setApproveOpen(true)}
                    >
                      Одобрить
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={acting}
                      onClick={() => setRejectOpen(true)}
                    >
                      Отклонить
                    </Button>
                  </div>
                </section>
              ) : null}

              {actionError ? <p className={styles.error}>{actionError}</p> : null}
            </div>
          </aside>
        </div>
      ) : null}

      <Modal
        open={approveOpen}
        title="Одобрить заявку?"
        onClose={() => setApproveOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setApproveOpen(false)} disabled={acting}>
              Отмена
            </Button>
            <Button type="button" onClick={() => void onApprove()} disabled={acting} loading={acting}>
              Подтвердить
            </Button>
          </>
        }
      >
        <p>
          Период отсутствия: <strong>{from}</strong> — <strong>{to}</strong>
          {approveDays ? ` (${approveDays} дн.)` : ''}
        </p>
        <p className={styles.cardMeta}>Студент увидит одобрение и период в личном кабинете.</p>
      </Modal>

      <Modal
        open={rejectOpen}
        title="Отклонить заявку"
        onClose={() => setRejectOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setRejectOpen(false)} disabled={acting}>
              Отмена
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => void onReject()}
              disabled={acting || (rejectPreset === 'Другая причина' && !rejectComment.trim())}
              loading={acting}
            >
              Отклонить
            </Button>
          </>
        }
      >
        <p className={styles.cardMeta}>Причина будет видна студенту или родителю.</p>
        <div className={styles.reasonList}>
          {REJECT_PRESETS.map((preset) => (
            <label key={preset} className={styles.reasonOption}>
              <input
                type="radio"
                name="reject-preset"
                checked={rejectPreset === preset}
                onChange={() => setRejectPreset(preset)}
              />
              <span>{preset}</span>
            </label>
          ))}
        </div>
        <label className={styles.field}>
          Комментарий{rejectPreset === 'Другая причина' ? ' (обязательно)' : ' (необязательно)'}
          <textarea
            className={styles.textarea}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Уточнение для заявителя"
          />
        </label>
      </Modal>

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  )
}
