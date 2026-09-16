/**
 * @file Отчёт отсутствующих (Казань / ZKBio) в админ-панели ЛК.
 */

import { useState, type FormEvent } from 'react'
import { ApiError } from '@/apiClient'
import {
  fetchAbsenceReport,
  setAbsenceParentNotice,
  type AbsenceReport,
  type AbsenceReportRow,
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

export function AdminLkAbsenceReportPage() {
  const [date, setDate] = useState(todayIso)
  const [report, setReport] = useState<AbsenceReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onBuild = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      const data = await fetchAbsenceReport({ date })
      setReport(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось построить отчёт')
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

  return (
    <section aria-label="Отчёт отсутствующих">
      <div className={styles.toolbar}>
        <h1 className={styles.pageTitle}>Отчёт отсутствующих</h1>
      </div>
      <p className={styles.statsHint}>
        Казань (ZKBio): состав берётся из справочника СКУД, ФИО/группа/телефон — из 1С по зачётке,
        отсутствие — по очным парам расписания и проходам за выбранную дату.
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
            <Button type="submit" disabled={busy}>
              {busy ? 'Строим…' : 'Построить отчёт'}
            </Button>
          </div>
        </div>
      </form>

      {busy && !report ? <Loader /> : null}

      {report ? (
        <div className={styles.usersCard}>
          <h2 className={styles.chartTitle}>
            {report.date} · {report.group}
            {report.scheduleRange ? ` · пары ${report.scheduleRange}` : ''} · в составе{' '}
            {report.rosterSize}, отсутствий {report.absentCount}
          </h2>
          {report.warnings.length > 0 ? (
            <ul className={styles.statsHint}>
              {report.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
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
    </section>
  )
}
