/**
 * @file Отчёт отсутствующих (голова / Perco) в админ-панели ЛК.
 */

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '@/apiClient'
import {
  fetchAbsenceReport,
  listGroupRosters,
  loadGroupRoster,
  saveGroupRoster,
  setAbsenceParentNotice,
  type AbsenceReport,
  type AbsenceReportRow,
  type GroupRoster,
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

function parseStudentIds(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function AdminLkAbsenceReportPage() {
  const [date, setDate] = useState(todayIso)
  const [group, setGroup] = useState('')
  const [studentIdsText, setStudentIdsText] = useState('')
  const [saveRoster, setSaveRoster] = useState(true)
  const [rosters, setRosters] = useState<GroupRoster[]>([])
  const [report, setReport] = useState<AbsenceReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRosters = useCallback(async () => {
    try {
      setRosters(await listGroupRosters())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadRosters()
  }, [loadRosters])

  const onLoadRoster = async () => {
    const name = group.trim()
    if (!name) {
      setError('Укажите номер группы')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const roster = await loadGroupRoster(name)
      setStudentIdsText(roster.studentIds.join('\n'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Состав группы не найден')
    } finally {
      setBusy(false)
    }
  }

  const onSaveRosterOnly = async () => {
    const name = group.trim()
    const ids = parseStudentIds(studentIdsText)
    if (!name || ids.length === 0) {
      setError('Укажите группу и зачётки')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await saveGroupRoster(name, ids)
      await loadRosters()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить состав')
    } finally {
      setBusy(false)
    }
  }

  const onBuild = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      const data = await fetchAbsenceReport({
        date,
        group: group.trim(),
        studentIds: parseStudentIds(studentIdsText),
        saveRoster,
      })
      setReport(data)
      if (saveRoster) {
        await loadRosters()
      }
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
        Головной вуз (Perco): студенты группы с очными парами, у которых нет присутствия на части
        или на всех парах. Состав группы задаётся зачётками (в 1С пока нет списка группы).
      </p>

      <form className={styles.card} style={{ marginBottom: '1.25rem' }} onSubmit={onBuild}>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <Input label="Дата" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Input
              label="Номер группы"
              name="group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="ЭБА С1-О/СПОо/К326"
              required
            />
          </div>
          <label className={styles.label}>
            Зачётки состава группы
            <textarea
              className={styles.input}
              rows={5}
              value={studentIdsText}
              onChange={(e) => setStudentIdsText(e.target.value)}
              placeholder={'172194\n172195\n…'}
            />
          </label>
          {rosters.length > 0 ? (
            <label className={styles.label}>
              Сохранённые составы
              <select
                className={styles.input}
                value=""
                onChange={(e) => {
                  const name = e.target.value
                  if (!name) return
                  setGroup(name)
                  const found = rosters.find((r) => r.groupName === name)
                  if (found) setStudentIdsText(found.studentIds.join('\n'))
                }}
              >
                <option value="">Выбрать…</option>
                {rosters.map((r) => (
                  <option key={r.groupName} value={r.groupName}>
                    {r.groupName} ({r.studentIds.length})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={saveRoster}
              onChange={(e) => setSaveRoster(e.target.checked)}
            />
            Сохранить состав группы при построении отчёта
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.footerActions}>
            <Button type="button" disabled={busy} onClick={() => void onLoadRoster()}>
              Загрузить состав
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSaveRosterOnly()}>
              Только сохранить состав
            </Button>
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
