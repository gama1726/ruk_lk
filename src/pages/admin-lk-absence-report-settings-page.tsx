/**
 * @file Настройки автоотчёта отсутствующих: тумблеры по кампусам (супер-админ).
 * Эффект = флаг деплоя AND тумблер.
 */

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  getAbsenceReportSettings,
  updateAbsenceReportSettings,
  type AbsenceReportCampus,
  type AbsenceReportCampusSettings,
  type AbsenceReportSettings,
} from '@/lk-admin'
import { Button, Loader, LoadError } from '@/ui'
import styles from './admin-events.module.css'

function FlagBadge({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`${styles.badge} ${on ? styles.badgeOn : styles.badgeOff}`} title={label}>
      {on ? 'флаг вкл' : 'флаг выкл'}
    </span>
  )
}

function EffectBadge({ on }: { on: boolean }) {
  return (
    <span className={`${styles.badge} ${on ? styles.badgeOn : styles.badgeOff}`}>
      {on ? 'работает' : 'не работает'}
    </span>
  )
}

export function AdminLkAbsenceReportSettingsPage() {
  const [data, setData] = useState<AbsenceReportSettings | null>(null)
  const [draft, setDraft] = useState<Record<AbsenceReportCampus, { auto: boolean; notify: boolean }>>(
    {} as Record<AbsenceReportCampus, { auto: boolean; notify: boolean }>,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  const applySnapshot = (next: AbsenceReportSettings) => {
    setData(next)
    const map = {} as Record<AbsenceReportCampus, { auto: boolean; notify: boolean }>
    for (const c of next.campuses) {
      map[c.campus] = { auto: c.autoEnabled, notify: c.notifyEnabled }
    }
    setDraft(map)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSavedOk(false)
    try {
      applySnapshot(await getAbsenceReportSettings())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить настройки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const setCampusToggle = (
    campus: AbsenceReportCampus,
    key: 'auto' | 'notify',
    value: boolean,
  ) => {
    setSavedOk(false)
    setDraft((prev) => ({
      ...prev,
      [campus]: { ...prev[campus], [key]: value },
    }))
  }

  const dirty =
    data != null &&
    data.campuses.some((c) => {
      const d = draft[c.campus]
      return !d || d.auto !== c.autoEnabled || d.notify !== c.notifyEnabled
    })

  const onSave = async () => {
    if (!data) return
    setSaving(true)
    setSaveError(null)
    setSavedOk(false)
    try {
      const next = await updateAbsenceReportSettings({
        campuses: data.campuses.map((c) => ({
          campus: c.campus,
          autoEnabled: draft[c.campus]?.auto ?? c.autoEnabled,
          notifyEnabled: draft[c.campus]?.notify ?? c.notifyEnabled,
        })),
      })
      applySnapshot(next)
      setSavedOk(true)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) {
    return <Loader />
  }

  if (error && !data) {
    return <LoadError message={error} onRetry={() => void load()} />
  }

  if (!data) return null

  return (
    <div>
      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        <h2 className={styles.cardTitle}>Автоотчёт отсутствующих</h2>
        <p className={styles.cardMeta}>
          Крон: <code>{data.autoCron}</code> (Europe/Moscow). Тумблер действует только если флаг
          деплоя включён — иначе «не работает», даже при включённом тумблере.
        </p>
      </div>

      {data.campuses.map((campus: AbsenceReportCampusSettings) => {
        const d = draft[campus.campus] ?? {
          auto: campus.autoEnabled,
          notify: campus.notifyEnabled,
        }
        const effectiveAuto = campus.flagAutoEnabled && d.auto
        const effectiveNotify = campus.flagNotifyEnabled && d.notify
        return (
          <div key={campus.campus} className={styles.card} style={{ marginBottom: '1rem' }}>
            <h2 className={styles.cardTitle}>{campus.label}</h2>
            <div className={styles.formGrid}>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={d.auto}
                  disabled={saving}
                  onChange={(e) => setCampusToggle(campus.campus, 'auto', e.target.checked)}
                />
                Автосборка в 21:00
                <FlagBadge on={campus.flagAutoEnabled} label="app.absence-report.*.auto-enabled" />
                <EffectBadge on={effectiveAuto} />
              </label>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={d.notify}
                  disabled={saving}
                  onChange={(e) => setCampusToggle(campus.campus, 'notify', e.target.checked)}
                />
                PDF-уведомления после DONE
                <FlagBadge
                  on={campus.flagNotifyEnabled}
                  label="app.absence-report.*.notify-enabled"
                />
                <EffectBadge on={effectiveNotify} />
              </label>
            </div>
          </div>
        )
      })}

      {saveError ? <p className={styles.error}>{saveError}</p> : null}
      {savedOk && !dirty ? <p className={styles.cardMeta}>Сохранено.</p> : null}
      <div className={styles.footerActions}>
        <Button type="button" disabled={saving || !dirty} onClick={() => void onSave()}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </div>
    </div>
  )
}
