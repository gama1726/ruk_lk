/**
 * @file Отчёт отсутствующих (Казань / ZKBio) в админ-панели ЛК.
 */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { groupAbsenceWarnings } from '@/absence-report-warnings'
import { ApiError } from '@/apiClient'
import {
  fetchAbsenceReport,
  getAbsenceReport,
  listAbsenceReports,
  setAbsenceParentNotice,
  type AbsenceReport,
  type AbsenceReportRow,
  type AbsenceReportSummary,
} from '@/lk-admin'
import { Button, Input, Loader } from '@/ui'
import styles from './admin-events.module.css'

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function statusLabel(status: string): string {
  if (status === 'RUNNING') return 'строится'
  if (status === 'DONE') return 'готов'
  if (status === 'FAILED') return 'ошибка'
  return status
}

function AbsenceWarningSections({ warnings }: { warnings: string[] }) {
  const sections = useMemo(() => groupAbsenceWarnings(warnings), [warnings])
  if (sections.length === 0) return null

  return (
    <div className={styles.warningSections}>
      {sections.map((section) => (
        <details
          key={section.id}
          className={styles.warningSection}
          open={section.id === 'summary'}
        >
          <summary className={styles.warningSectionSummary}>{section.title}</summary>
          <ul className={styles.warningSectionList}>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  )
}

export function AdminLkAbsenceReportPage() {
  const [date, setDate] = useState(todayIso)
  const [report, setReport] = useState<AbsenceReport | null>(null)
  const [saved, setSaved] = useState<AbsenceReportSummary[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSaved = useCallback(async () => {
    try {
      setSaved(await listAbsenceReports())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadSaved()
  }, [loadSaved])

  useEffect(() => {
    if (!report || report.status !== 'RUNNING' || !report.id) return
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const next = await getAbsenceReport(report.id)
          setReport(next)
          if (next.status !== 'RUNNING') {
            await loadSaved()
          }
        } catch (err) {
          setError(err instanceof ApiError ? err.message : 'Не удалось обновить статус отчёта')
        }
      })()
    }, 2500)
    return () => window.clearInterval(timer)
  }, [report?.id, report?.status, loadSaved])

  const onBuild = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      const started = await fetchAbsenceReport({ date })
      setReport(started)
      await loadSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось запустить отчёт')
    } finally {
      setBusy(false)
    }
  }

  const onOpenSaved = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      setReport(await getAbsenceReport(id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось открыть отчёт')
    } finally {
      setBusy(false)
    }
  }

  const onToggleNotice = async (row: AbsenceReportRow) => {
    if (!report) return
    const next = !row.parentNotified
    try {
      await setAbsenceParentNotice(report.date, row.studentId, next)
      setReport({
        ...report,
        rows: report.rows.map((r) =>
          r.studentId === row.studentId ? { ...r, parentNotified: next } : r,
        ),
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить отметку')
    }
  }

  const building = report?.status === 'RUNNING'

  return (
    <section aria-label="Отчёт отсутствующих">
      <div className={styles.toolbar}>
        <h1 className={styles.pageTitle}>Отчёт отсутствующих</h1>
      </div>
      <p className={styles.statsHint}>
        Казань (ZKBio): массовые проходы за день + зачётка (emp_code или nickname длины 6) +
        профиль/группа из 1С + очные пары. Отчёт строится в фоне и сохраняется — можно открыть из
        списка ниже.
      </p>

      <form className={styles.card} style={{ marginBottom: '1.25rem' }} onSubmit={onBuild}>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <Input
              label="Дата"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.footerActions}>
            <Button type="submit" disabled={busy || building}>
              {building ? 'Строим…' : busy ? 'Запуск…' : 'Построить отчёт'}
            </Button>
          </div>
        </div>
      </form>

      {saved.length > 0 ? (
        <div className={styles.usersCard} style={{ marginBottom: '1.25rem' }}>
          <h2 className={styles.chartTitle}>Сохранённые отчёты</h2>
          <div className={styles.usersTableWrap}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Статус</th>
                  <th>Проверено</th>
                  <th>Отсутствий</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {saved.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{statusLabel(item.status)}</td>
                    <td>{item.rosterSize}</td>
                    <td>{item.absentCount}</td>
                    <td>
                      <Button type="button" disabled={busy} onClick={() => void onOpenSaved(item.id)}>
                        Открыть
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {building ? <Loader /> : null}

      {report && report.status === 'FAILED' ? (
        <p className={styles.error}>{report.error || 'Не удалось построить отчёт'}</p>
      ) : null}

      {report && report.status === 'DONE' ? (
        <div className={styles.usersCard}>
          <h2 className={styles.chartTitle}>
            {report.date} · {report.group}
            {report.scheduleRange ? ` · пары ${report.scheduleRange}` : ''} · проверено{' '}
            {report.rosterSize}, отсутствий {report.absentCount}
          </h2>
          <AbsenceWarningSections warnings={report.warnings} />
          <div className={styles.usersTableWrap}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Номер группы</th>
                  <th>ФИО</th>
                  <th>Телефон</th>
                  <th>Расписание</th>
                  <th>Время отсутствия</th>
                  <th>Уведомление родителям</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Нет отсутствий по очным парам за выбранную дату</td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
                    <tr key={row.studentId}>
                      <td>{row.date}</td>
                      <td>{row.group}</td>
                      <td>
                        {row.fullName}
                        <div className={styles.cardMeta}>{row.studentId}</div>
                      </td>
                      <td>{row.phone || '—'}</td>
                      <td>{row.scheduleRange || '—'}</td>
                      <td>
                        {row.absenceRange}
                        <div className={styles.cardMeta}>
                          {row.kind === 'full' ? 'не приходил' : 'частично'}
                        </div>
                      </td>
                      <td>
                        <label className={styles.checkRow}>
                          <input
                            type="checkbox"
                            checked={row.parentNotified}
                            onChange={() => void onToggleNotice(row)}
                          />
                          {row.parentNotified ? 'отправлено' : 'нет'}
                        </label>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {report && report.status === 'RUNNING' && report.warnings.length > 0 ? (
        <AbsenceWarningSections warnings={report.warnings} />
      ) : null}
    </section>
  )
}
