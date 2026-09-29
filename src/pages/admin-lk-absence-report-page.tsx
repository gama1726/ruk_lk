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
  sendAbsenceNoticeOne,
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

function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} мс`
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${totalSec} с`
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  if (minutes < 60) {
    return seconds > 0 ? `${minutes} м ${seconds} с` : `${minutes} м`
  }
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return remMin > 0 ? `${hours} ч ${remMin} м` : `${hours} ч`
}

function stageDurationByPhase(
  timings: AbsenceReport['stageTimings'] | undefined,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const stage of timings ?? []) {
    if (!stage?.phase) continue
    map.set(stage.phase, (map.get(stage.phase) ?? 0) + (stage.durationMs ?? 0))
  }
  return map
}

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

/** ISO yyyy-MM-dd → дд.мм.гггг */
function formatReportDateRu(iso: string | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso?.trim() || ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function campusLabelFriendly(raw: string | undefined): string {
  if (!raw?.trim()) return 'Казани'
  const cleaned = raw.replace(/\s*\(ZKBio\)\s*/gi, '').trim()
  if (!cleaned || /^казань$/i.test(cleaned)) return 'Казани'
  return cleaned
}

/** Заголовок готового отчёта для UI. */
function doneReportTitle(report: AbsenceReport): string {
  const date = formatReportDateRu(report.date)
  const campus = campusLabelFriendly(report.group)
  return `Отчёт отсутствующих за ${date} в ${campus}`
}

function stepIndex(phase: string | undefined): number {
  const idx = PROGRESS_STEPS.findIndex((s) => s.id === phase)
  return idx >= 0 ? idx : 0
}

function AbsenceWarningSections({
  warnings,
  includeTechSections,
}: {
  warnings: string[]
  includeTechSections: boolean
}) {
  const sections = useMemo(
    () => groupAbsenceWarnings(warnings, { includeTechSections }),
    [warnings, includeTechSections],
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
  showTimings,
}: {
  report: AbsenceReport
  canCancel: boolean
  onCancelClick: () => void
  cancelBusy: boolean
  showTimings: boolean
}) {
  const percent = Math.max(0, Math.min(100, report.progressPercent ?? 0))
  const active = stepIndex(report.progressPhase)
  const label = report.progressLabel?.trim() || 'Строим отчёт…'
  const hasCounts = (report.progressTotal ?? 0) > 0
  const byPhase = stageDurationByPhase(report.stageTimings)

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
        {showTimings && report.buildDurationMs != null
          ? ` · прошло ${formatDurationMs(report.buildDurationMs)}`
          : null}
      </p>
      <ol className={styles.progressSteps}>
        {PROGRESS_STEPS.filter((s) => s.id !== 'done').map((step, i) => {
          const cls =
            i < active
              ? `${styles.progressStep} ${styles.progressStepDone}`
              : i === active
                ? `${styles.progressStep} ${styles.progressStepActive}`
                : styles.progressStep
          const stageMs = byPhase.get(step.id)
          return (
            <li key={step.id} className={cls}>
              {i < active ? '✓ ' : i === active ? '→ ' : '· '}
              {step.label}
              {showTimings && stageMs != null ? ` · ${formatDurationMs(stageMs)}` : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function AbsenceBuildTimings({ report }: { report: AbsenceReport }) {
  const stages = report.stageTimings ?? []
  if (report.buildDurationMs == null && stages.length === 0) return null

  const labelByPhase = new Map<string, string>(PROGRESS_STEPS.map((s) => [s.id, s.label]))

  return (
    <div className={styles.statsHint} style={{ marginBottom: '0.75rem' }}>
      <p style={{ margin: '0 0 0.35rem' }}>
        Время сборки: <strong>{formatDurationMs(report.buildDurationMs)}</strong>
      </p>
      {stages.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {stages.map((stage, i) => (
            <li key={`${stage.phase}-${i}`}>
              {labelByPhase.get(stage.phase) ?? stage.label ?? stage.phase}:{' '}
              {formatDurationMs(stage.durationMs)}
            </li>
          ))}
        </ul>
      ) : null}
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
  const includeTechSections = isSuperAdmin
  const [date, setDate] = useState(todayIso)
  const [report, setReport] = useState<AbsenceReport | null>(null)
  const [saved, setSaved] = useState<AbsenceReportSummary[]>([])
  const [found, setFound] = useState<AbsenceReportSummary[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [notifyStudentId, setNotifyStudentId] = useState<string | null>(null)

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

  const onSendNotice = async (row: AbsenceReportRow) => {
    if (!report || !isSuperAdmin) return
    setNotifyStudentId(row.studentId)
    setError(null)
    try {
      await sendAbsenceNoticeOne(
        report.date,
        row.studentId,
        row.fullName,
        row.kind,
        row.absenceRange,
      )
      setReport({
        ...report,
        rows: report.rows.map((r) =>
          r.studentId === row.studentId ? { ...r, parentNotified: true } : r,
        ),
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить уведомление')
    } finally {
      setNotifyStudentId(null)
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
      {includeTechSections ? (
        <p className={styles.statsHint}>
          Казань (ZKBio): массовые проходы за день + зачётка (emp_code или nickname длины 6) +
          профиль/группа из 1С + очные пары. В колонке контактов — телефоны родителей из 1С.
          После построения отчёта уведомления (PDF) уходят автоматически. Супер-админ может
          отправить или переотправить уведомление по кнопке в строке; галочка — факт успешной
          отправки (видна всем админам). Канал: MAX, иначе email.
        </p>
      ) : (
        <p className={styles.statsHint}>
          Выберите дату и найдите готовый отчёт. В списке — по одному отчёту на день.
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
                  {isSuperAdmin ? <th>Тип</th> : null}
                  <th>Статус</th>
                  <th>Проверено</th>
                  <th>Отсутствий</th>
                  {isSuperAdmin ? <th>Время сборки</th> : null}
                  <th />
                </tr>
              </thead>
              <tbody>
                {listForTable.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    {isSuperAdmin ? <td>{originLabel(item.origin)}</td> : null}
                    <td>{statusLabel(item.status)}</td>
                    <td>{item.rosterSize}</td>
                    <td>{item.absentCount}</td>
                    {isSuperAdmin ? <td>{formatDurationMs(item.buildDurationMs)}</td> : null}
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
          showTimings={isSuperAdmin}
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
              {doneReportTitle(report)}
            </h2>
            <Button type="button" disabled={downloadBusy || busy} onClick={() => void onDownloadExcel()}>
              {downloadBusy ? 'Скачивание…' : 'Скачать Excel'}
            </Button>
          </div>
          {isSuperAdmin ? <AbsenceBuildTimings report={report} /> : null}
          <AbsenceWarningSections warnings={report.warnings} includeTechSections={includeTechSections} />
          <div className={styles.absenceTableWrap}>
            <table className={styles.absenceTable}>
              <thead>
                <tr>
                  <th className={styles.absenceColDate}>Зачётка</th>
                  <th className={styles.absenceColGroup}>Номер группы</th>
                  <th className={styles.absenceColName}>ФИО</th>
                  <th className={styles.absenceColPhone}>Телефон родителя</th>
                  <th className={styles.absenceColSchedule}>Время занятий</th>
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
                      <td className={styles.absenceColDate}>{row.studentId}</td>
                      <td className={styles.absenceColGroup}>{row.group}</td>
                      <td className={styles.absenceColName}>{row.fullName}</td>
                      <td className={styles.absenceColPhone}>{row.phone || '—'}</td>
                      <td className={styles.absenceColSchedule}>{row.scheduleRange || '—'}</td>
                      <td className={styles.absenceColVisit}>
                        {row.kind === 'full' ? (
                          'неявка на все пары'
                        ) : (
                          <span className={styles.absenceVisitLines}>
                            {(row.absenceRange || '')
                              .split(/\n|; /)
                              .map((line) => line.trim())
                              .filter((line) => line && !/— Вовремя\b/.test(line))
                              .join('\n') || '—'}
                          </span>
                        )}
                      </td>
                      <td className={styles.absenceColNotice}>
                        <div className={styles.checkRow}>
                          <input type="checkbox" checked={row.parentNotified} disabled readOnly />
                          <span>{row.parentNotified ? 'да' : 'нет'}</span>
                          {isSuperAdmin ? (
                            <Button
                              type="button"
                              disabled={busy || notifyStudentId === row.studentId}
                              onClick={() => void onSendNotice(row)}
                            >
                              {notifyStudentId === row.studentId
                                ? 'Отправка…'
                                : row.parentNotified
                                  ? 'Переотправить'
                                  : 'Отправить'}
                            </Button>
                          ) : null}
                        </div>
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
        <AbsenceWarningSections warnings={report.warnings} includeTechSections={includeTechSections} />
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
