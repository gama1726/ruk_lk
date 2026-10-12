/**
 * @file Очередь справок по кампусу (Голова / Казань / Краснодар).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '@/apiClient'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

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

  if (!campus) {
    return <LoadError message="Неизвестный кампус. Откройте Казань, Краснодар или Голову." />
  }

  if (loading) return <Loader />
  if (error) return <LoadError message={error} onRetry={() => void load()} />

  const pending = items.filter((i) => i.status === 'PENDING')

  return (
    <div>
      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        <div className={styles.cardTop}>
          <h2 className={styles.cardTitle}>Справки · {CAMPUS_LABEL[campus]}</h2>
          <Button type="button" onClick={() => void load()} disabled={saving}>
            Обновить
          </Button>
        </div>
        <p className={styles.cardMeta}>
          Очередь заявок филиала. Подлинность проверяйте вне ЛК; здесь — решение и период отсутствия.
        </p>
      </div>

      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        <h2 className={styles.cardTitle}>Уведомления о новых заявках</h2>
        <p className={styles.cardMeta}>
          Если указать email — при новой заявке уйдёт письмо. Пустое поле — только очередь в панели.
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

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>На проверке · {pending.length}</h2>
        {pending.length === 0 ? (
          <p className={styles.cardMeta}>
            Пока нет заявок. Раздел для студентов и родителей доступен только зачёткам из preview
            allowlist.
          </p>
        ) : (
          <ul className={styles.list}>
            {pending.map((item) => (
              <li key={item.id} className={styles.card} style={{ marginBottom: '0.75rem' }}>
                <div className={styles.cardTitle}>{item.studentFullName || item.studentId}</div>
                <p className={styles.cardMeta}>
                  {item.typeLabel} · {new Date(item.createdAt).toLocaleString('ru-RU')} ·{' '}
                  {item.studentId}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
