/**
 * @file Очередь справок по кампусу: список, просмотр, одобрение/отклонение, notify email.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError, apiGetBlob } from '@/apiClient'
import {
  approveCertificate,
  certificateStatusLabel,
  getAdminCertificate,
  rejectCertificate,
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
import { Button, Loader, LoadError } from '@/ui'
import styles from './admin-events.module.css'

const CAMPUS_LABEL: Record<AbsenceReportCampus, string> = {
  KAZAN: 'Казань',
  KRASNODAR: 'Краснодар',
  HEAD: 'Голова',
}

function parseCampus(raw: string | undefined): AbsenceReportCampus | null {
  const value = (raw ?? '').trim().toUpperCase()
  if (value === 'KAZAN' || value === 'KRASNODAR' || value === 'HEAD') return value
  return null
}

export function AdminLkCertificatesPage() {
  const { campus: campusParam } = useParams()
  const campus = useMemo(() => parseCampus(campusParam), [campusParam])

  const [items, setItems] = useState<CertificateRequestSummary[]>([])
  const [settings, setSettings] = useState<CertificateSettings | null>(null)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [selected, setSelected] = useState<CertificateRequest | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  const openRequest = async (id: string) => {
    if (!campus) return
    setActionError(null)
    setActing(true)
    try {
      const detail = await getAdminCertificate(campus, id)
      setSelected(detail)
      setFrom(detail.approvedFrom ?? '')
      setTo(detail.approvedTo ?? '')
      setRejectReason('')
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось открыть заявку')
    } finally {
      setActing(false)
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
    } catch (err) {
      setSaveMsg(err instanceof ApiError ? err.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const onApprove = async () => {
    if (!campus || !selected) return
    setActionError(null)
    setActing(true)
    try {
      const next = await approveCertificate(campus, selected.id, from, to)
      setSelected(next)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Не удалось одобрить')
    } finally {
      setActing(false)
    }
  }

  const onReject = async () => {
    if (!campus || !selected) return
    setActionError(null)
    setActing(true)
    try {
      const next = await rejectCertificate(campus, selected.id, rejectReason)
      setSelected(next)
      await load()
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

  const pending = items.filter((i) => i.status === 'PENDING')
  const others = items.filter((i) => i.status !== 'PENDING')

  return (
    <div>
      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        <div className={styles.cardTop}>
          <h2 className={styles.cardTitle}>Справки · {CAMPUS_LABEL[campus]}</h2>
          <Button type="button" onClick={() => void load()} disabled={saving || acting}>
            Обновить
          </Button>
        </div>
        <p className={styles.cardMeta}>
          Подлинность проверяйте вне ЛК. Здесь — решение и период отсутствия (полные дни).
        </p>
      </div>

      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        <h2 className={styles.cardTitle}>Уведомления о новых заявках</h2>
        <p className={styles.cardMeta}>
          Email необязателен: если пусто — только очередь в панели.
        </p>
        <div className={styles.formGrid} style={{ marginTop: '0.75rem' }}>
          <input
            className={styles.input}
            type="email"
            placeholder="notify@example.ru"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            disabled={saving}
          />
          <div className={styles.footerActions}>
            <Button type="button" onClick={() => void saveSettings()} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
            {settings?.notifyEmail ? (
              <span className={`${styles.badge} ${styles.badgeOn}`}>письма включены</span>
            ) : (
              <span className={`${styles.badge} ${styles.badgeOff}`}>письма выкл</span>
            )}
            {saveMsg ? <span className={styles.cardMeta}>{saveMsg}</span> : null}
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        <h2 className={styles.cardTitle}>На проверке · {pending.length}</h2>
        {pending.length === 0 ? (
          <p className={styles.cardMeta}>Нет заявок на проверке.</p>
        ) : (
          <ul className={styles.list}>
            {pending.map((item) => (
              <li key={item.id} className={styles.card} style={{ marginBottom: '0.75rem' }}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.cardTitle}>{item.studentFullName || item.studentId}</div>
                    <p className={styles.cardMeta}>
                      {item.typeLabel} · {new Date(item.createdAt).toLocaleString('ru-RU')} ·{' '}
                      {item.studentId}
                    </p>
                  </div>
                  <Button type="button" onClick={() => void openRequest(item.id)} disabled={acting}>
                    Открыть
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {others.length > 0 ? (
        <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
          <h2 className={styles.cardTitle}>Обработанные · {others.length}</h2>
          <ul className={styles.list}>
            {others.slice(0, 30).map((item) => (
              <li key={item.id} className={styles.cardMeta} style={{ marginBottom: 8 }}>
                {item.studentFullName || item.studentId} · {item.typeLabel} ·{' '}
                {certificateStatusLabel(item.status)}{' '}
                <Button type="button" onClick={() => void openRequest(item.id)} disabled={acting}>
                  Карточка
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {selected ? (
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <h2 className={styles.cardTitle}>
              {selected.studentFullName} · {certificateStatusLabel(selected.status)}
            </h2>
            <Button type="button" onClick={() => setSelected(null)}>
              Закрыть
            </Button>
          </div>
          <p className={styles.cardMeta}>
            {selected.typeLabel} · зачётка {selected.studentId} · от{' '}
            {selected.submitterName || selected.submittedBy}
          </p>
          {selected.comment ? <p>Комментарий: {selected.comment}</p> : null}
          {selected.rejectionReason ? <p>Причина отклонения: {selected.rejectionReason}</p> : null}
          {selected.approvedFrom && selected.approvedTo ? (
            <p>
              Период: {selected.approvedFrom} — {selected.approvedTo}
            </p>
          ) : null}

          <h3 className={styles.cardTitle}>Файлы</h3>
          <ul className={styles.list}>
            {selected.attachments.map((a) => (
              <li key={a.id} style={{ marginBottom: 8 }}>
                {a.originalFilename}{' '}
                <span className={styles.cardMeta}>({Math.round(a.sizeBytes / 1024)} КБ)</span>{' '}
                <Button
                  type="button"
                  onClick={() =>
                    void (async () => {
                      try {
                        const path = `/api/admin/lk/certificates/${campus.toLowerCase()}/requests/${selected.id}/attachments/${a.id}`
                        const { blob, filename } = await apiGetBlob(path)
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = filename || a.originalFilename
                        link.click()
                        URL.revokeObjectURL(url)
                      } catch (err) {
                        setActionError(err instanceof ApiError ? err.message : 'Не удалось скачать')
                      }
                    })()
                  }
                >
                  Скачать
                </Button>
              </li>
            ))}
          </ul>

          {selected.status === 'PENDING' ? (
            <>
              <h3 className={styles.cardTitle}>Одобрить</h3>
              <div className={styles.formGrid}>
                <label>
                  С
                  <input
                    className={styles.input}
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    disabled={acting}
                  />
                </label>
                <label>
                  По
                  <input
                    className={styles.input}
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    disabled={acting}
                  />
                </label>
                <Button type="button" onClick={() => void onApprove()} disabled={acting || !from || !to}>
                  Одобрить
                </Button>
              </div>

              <h3 className={styles.cardTitle}>Отклонить</h3>
              <textarea
                className={styles.input}
                rows={3}
                placeholder="Причина (обязательно, увидит заявитель)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={acting}
              />
              <div className={styles.footerActions}>
                <Button
                  type="button"
                  onClick={() => void onReject()}
                  disabled={acting || !rejectReason.trim()}
                >
                  Отклонить
                </Button>
              </div>
            </>
          ) : null}

          {actionError ? <p className={styles.error}>{actionError}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
