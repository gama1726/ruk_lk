/**
 * @file Отчёт отсутствующих (Казань / ZKBio) в админ-панели ЛК.
 */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { groupAbsenceWarnings } from '@/absence-report-warnings'
import { ApiError } from '@/apiClient'
import {
  cancelAbsenceReport,
  downloadAbsenceReportExcel,
  fetchAbsenceReport,
  getAbsenceReport,
  listAbsenceReports,
  setAbsenceParentNotice,
  type AbsenceReport,
  type AbsenceReportRow,
  type AbsenceReportSummary,
  type LkAdminMe,
} from '@/lk-admin'
import { Button, Input, Modal } from '@/ui'
import styles from './admin-events.module.css'

const PROGRESS_STEPS = [
  { id: 'queued', label: 'В очереди' },
  { id: 'employees', label: 'Сотрудники ZKBio' },
  { id: 'punches', label: 'Проходы за день' },
  { id: 'profiles', label: 'Профили 1С' },
  { id: 'schedule', label: 'Расписание групп' },
  { id: 'matching', label: 'Сверка отсутствий' },
  { id: 'done', label: 'Готово' },
] as const

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
  if (status === 'CANCELLED') return 'отменён'
  return status
}

function originLabel(origin: string | undefined): string {
  if (origin === 'AUTO') return 'Автоматический'
  return 'Ручной'
}

function stepIndex(phase: string | undefined): number {
  const idx = PROGRESS_STEPS.findIndex((s) => s.id === phase)
  return idx >= 0 ? idx : 0
}

function AbsenceWarningSections({
  warnings,
  includeSummary,
}: {
  warnings: string[]
  includeSummary: boolean
}) {
  const sections = useMemo(
    () => groupAbsenceWarnings(warnings, { includeSummary }),
    [warnings, includeSummary],
  )
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

function AbsenceBuildProgress({
  report,
  canCancel,
  onCancelClick,
  cancelBusy,
}: {
  report: AbsenceReport
  canCancel: boolean
  onCancelClick: () => void
  cancelBusy: boolean
}) {
  const percent = Math.max(0, Math.min(100, report.progressPercent ?? 0))
  const active = stepIndex(report.progressPhase)
  const label = report.progressLabel?.trim() || 'Строим отчёт…'
  const hasCounts = (report.progressTotal ?? 0) > 0

  return (
    <div className={styles.progressCard} aria-live="polite">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <p className={styles.progressTitle} style={{ margin: 0 }}>
          {originLabel(report.origin)} · {label}
        </p>
        {canCancel ? (
          <Button type="button" variant="secondary" disabled={cancelBusy} onClick={onCancelClick}>
            {cancelBusy ? 'Отмена…' : 'Прервать'}
          </Button>
        ) : null}
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
      <p className={styles.progressMeta}>
        {percent}%
        {hasCounts ? ` · ${report.progressCurrent ?? 0} / ${report.progressTotal}` : null}
      </p>
      <ol className={styles.progressSteps}>
        {PROGRESS_STEPS.filter((s) => s.id !== 'done').map((step, i) => {
          const cls =
            i < active
              ? `${styles.progressStep} ${styles.progressStepDone}`
              : i === active
                ? `${styles.progressStep} ${styles.progressStepActive}`
                : styles.progressStep
          return (
            <li key={step.id} className={cls}>
              {i < active ? '✓ ' : i === active ? '→ ' : '· '}
              {step.label}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Для супер-админа при поиске: предпочитаем DONE AUTO, затем DONE MANUAL. */
function pickReportForDate(items: AbsenceReportSummary[], date: string): AbsenceReportSummary | null {
  const forDate = items.filter((item) => item.date === date)
  if (forDate.length === 0) return null
  const doneAuto = forDate.find((item) => item.status === 'DONE' && item.origin === 'AUTO')
  if (doneAuto) return doneAuto
  const doneManual = forDate.find((item) => item.status === 'DONE' && item.origin !== 'AUTO')
  if (doneManual) return doneManual
  const anyDone = forDate.find((item) => item.status === 'DONE')
  if (anyDone) return anyDone
  return forDate[0] ?? null
}

export function AdminLkAbsenceReportPage() {
  const { me } = useOutletContext<{ me?: LkAdminMe }>()
  const isSuperAdmin = me?.superAdmin === true
  const includeSummary = isSuperAdmin
  const [date, setDate] = useState(todayIso)
  const [report, setReport] = useState<AbsenceReport | null>(null)
  const [saved, setSaved] = useState<AbsenceReportSummary[]>([])
  const [found, setFound] = useState<AbsenceReportSummary[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)

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
    if (!isSuperAdmin) return
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
    }, 1500)
    return () => window.clearInterval(timer)
  }, [isSuperAdmin, report?.id, report?.status, loadSaved])

  const onBuild = async (e: FormEvent) => {
    e.preventDefault()
    if (!isSuperAdmin) return
    setBusy(true)
    setError(null)
    setFound(null)
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

  const onFind = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      const list = await listAbsenceReports()
      setSaved(list)
      const matches = list.filter((item) => item.date === date)
      setFound(matches)
      if (matches.length === 0) {
        setError(`Готового отчёта за ${date} нет`)
        return
      }
      const pick = pickReportForDate(list, date) ?? matches[0]
      if (pick) {
        setReport(await getAbsenceReport(pick.id))
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось найти отчёт')
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

  const onConfirmCancel = async () => {
    if (!report?.id || !isSuperAdmin) return
    setCancelBusy(true)
    setError(null)
    try {
      const next = await cancelAbsenceReport(report.id)
      setReport(next)
      setCancelConfirmOpen(false)
      await loadSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось прервать отчёт')
    } finally {
      setCancelBusy(false)
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

  const onDownloadExcel = async () => {
    if (!report?.id) return
    setDownloadBusy(true)
    setError(null)
    try {
      await downloadAbsenceReportExcel(report.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось скачать Excel')
    } finally {
      setDownloadBusy(false)
    }
  }

  const building = report?.status === 'RUNNING'
  const listForTable = found ?? saved

  return (
    <section className={styles.absencePage} aria-label="Отчёт отсутствующих">
      <div className={styles.toolbar}>
        <h1 className={styles.pageTitle}>Отчёт отсутствующих</h1>
      </div>
      {includeSummary ? (
        <p className={styles.statsHint}>
          Казань (ZKBio): массовые проходы за день + зачётка (emp_code или nickname длины 6) +
          профиль/группа из 1С + очные пары. В колонке контактов — телефоны родителей из 1С.
          Ручной отчёт может запускать только супер-админ. В 21:00 МСК — автоматический отчёт.
        </p>
      ) : (
        <p className={styles.statsHint}>
          Выберите дату и найдите готовый отчёт. В списке — по одному успешному отчёту на день
          (если есть и авто, и ручной — показывается автоматический).
        </p>
      )}

      <form
        className={styles.card}
        style={{ marginBottom: '1.25rem' }}
        onSubmit={isSuperAdmin ? onBuild : onFind}
      >
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <Input
              label="Дата"
              name="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setFound(null)
              }}
              required
            />
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.footerActions}>
            {isSuperAdmin ? (
              <Button type="submit" disabled={busy}>
                {busy ? 'Запуск…' : 'Построить отчёт'}
              </Button>
            ) : (
              <Button type="submit" disabled={busy}>
                {busy ? 'Поиск…' : 'Найти отчёт'}
              </Button>
            )}
            {found !== null && !isSuperAdmin ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setFound(null)
                  setError(null)
                }}
              >
                Показать все
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      {listForTable.length > 0 ? (
        <div className={styles.usersCard} style={{ marginBottom: '1.25rem' }}>
          <h2 className={styles.chartTitle}>
            {found !== null ? `Отчёты за ${date}` : 'Сохранённые отчёты'}
          </h2>
          <div className={styles.usersTableWrap}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Проверено</th>
                  <th>Отсутствий</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {listForTable.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{originLabel(item.origin)}</td>
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

      {building && report ? (
        <AbsenceBuildProgress
          report={report}
          canCancel={isSuperAdmin}
          cancelBusy={cancelBusy}
          onCancelClick={() => setCancelConfirmOpen(true)}
        />
      ) : null}

      {report && report.status === 'FAILED' ? (
        <p className={styles.error}>
          {originLabel(report.origin)}: {report.error || 'Не удалось построить отчёт'}
        </p>
      ) : null}

      {report && report.status === 'CANCELLED' ? (
        <p className={styles.statsHint}>
          {originLabel(report.origin)} отменён
          {report.error ? `: ${report.error}` : ''}.
        </p>
      ) : null}

      {report && report.status === 'DONE' ? (
        <div className={styles.usersCard}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <h2 className={styles.chartTitle} style={{ margin: 0 }}>
              {originLabel(report.origin)} · {report.date} · {report.group}
              {report.scheduleRange ? ` · пары ${report.scheduleRange}` : ''} · проверено{' '}
              {report.rosterSize}, отсутствий {report.absentCount}
            </h2>
            <Button type="button" disabled={downloadBusy || busy} onClick={() => void onDownloadExcel()}>
              {downloadBusy ? 'Скачивание…' : 'Скачать Excel'}
            </Button>
          </div>
          <AbsenceWarningSections warnings={report.warnings} includeSummary={includeSummary} />
          <div className={styles.absenceTableWrap}>
            <table className={styles.absenceTable}>
              <thead>
                <tr>
                  <th className={styles.absenceColDate}>Дата</th>
                  <th className={styles.absenceColGroup}>Номер группы</th>
                  <th className={styles.absenceColName}>ФИО</th>
                  <th className={styles.absenceColPhone}>Телефон родителя</th>
                  <th className={styles.absenceColSchedule}>Расписание</th>
                  <th className={styles.absenceColVisit}>Посещение по парам</th>
                  <th className={styles.absenceColNotice}>Уведомление</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Нет отсутствий по очным парам за указанную дату</td>
                  </tr>
                ) : (
                  report.rows.map((row) => (
                    <tr key={row.studentId}>
                      <td className={styles.absenceColDate}>{row.date}</td>
                      <td className={styles.absenceColGroup}>{row.group}</td>
                      <td className={styles.absenceColName}>
                        {row.fullName}
                        <div className={styles.cardMeta}>{row.studentId}</div>
                      </td>
                      <td className={styles.absenceColPhone}>{row.phone || '—'}</td>
                      <td className={styles.absenceColSchedule}>{row.scheduleRange || '—'}</td>
                      <td className={styles.absenceColVisit}>
                        {row.kind === 'full' ? (
                          'неявка на все пары'
                        ) : (
                          <span className={styles.absenceVisitLines}>
                            {(row.absenceRange || '—').split(/\n|; /).join('\n')}
                          </span>
                        )}
                      </td>
                      <td className={styles.absenceColNotice}>
                        <label className={styles.checkRow}>
                          <input
                            type="checkbox"
                            checked={row.parentNotified}
                            onChange={() => void onToggleNotice(row)}
                          />
                          {row.parentNotified ? 'да' : 'нет'}
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
        <AbsenceWarningSections warnings={report.warnings} includeSummary={includeSummary} />
      ) : null}

      {isSuperAdmin ? (
        <Modal
          open={cancelConfirmOpen}
          title="Прервать построение?"
          onClose={() => {
            if (!cancelBusy) setCancelConfirmOpen(false)
          }}
          footer={
            <div className={styles.footerActions}>
              <Button
                type="button"
                variant="secondary"
                disabled={cancelBusy}
                onClick={() => setCancelConfirmOpen(false)}
              >
                Нет, продолжить
              </Button>
              <Button type="button" disabled={cancelBusy} onClick={() => void onConfirmCancel()}>
                {cancelBusy ? 'Отмена…' : 'Да, прервать'}
              </Button>
            </div>
          }
        >
          <p style={{ margin: 0 }}>
            Построение {report?.origin === 'AUTO' ? 'автоматического' : 'ручного'} отчёта за{' '}
            {report?.date} будет остановлено. Уже выполненные шаги не сохранятся как готовый отчёт.
          </p>
        </Modal>
      ) : null}
    </section>
  )
}
