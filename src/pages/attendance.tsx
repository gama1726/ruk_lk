import { useMemo, useState } from 'react'
import { programLabel } from '@/mocks/format'
import {
  attendancePeriods,
  attendanceSubjects,
  attendanceSummary,
  filterAttendance,
  formatAttendanceDate,
  markStatusKey,
  type AttendancePeriod,
} from '@/mocks/attendance'
import { attendanceMarkLabel } from '@/mocks/attendance-types'
import { useCurrentProgram } from '@/study'
import {
  ScreenHeader,
  Select,
  Button,
  NoData,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  StatusBadge,
} from '@/ui'
import styles from './attendance.module.css'

/**
 * Страница посещаемости: фильтры, сводка по дисциплинам, журнал занятий.
 */
export function Attendance() {
  const program = useCurrentProgram()
  const subjects = useMemo(() => attendanceSubjects(program.id), [program.id])

  const [subject, setSubject] = useState('all')
  const [period, setPeriod] = useState<AttendancePeriod>('2026-spring')
  const [appliedSubject, setAppliedSubject] = useState('all')
  const [appliedPeriod, setAppliedPeriod] = useState<AttendancePeriod>('2026-spring')

  const summary = attendanceSummary(program.id)
  const rows = filterAttendance(program.id, appliedSubject, appliedPeriod)

  const subjectOptions = [{ value: 'all', label: 'Все дисциплины' }, ...subjects.map((s) => ({ value: s, label: s }))]
  const periodOptions = attendancePeriods.map((p) => ({ value: p.id, label: p.label }))

  const applyFilters = () => {
    setAppliedSubject(subject)
    setAppliedPeriod(period)
  }

  const resetFilters = () => {
    setSubject('all')
    setPeriod('2026-spring')
    setAppliedSubject('all')
    setAppliedPeriod('2026-spring')
  }

  const barClass = (percent: number) => {
    if (percent < 70) return styles.barFillBad
    if (percent < 80) return styles.barFillLow
    return styles.barFill
  }

  return (
    <>
      <ScreenHeader title="Посещаемость (dev)" subtitle={programLabel(program)} />

      <div className={styles.filters}>
        <Select label="Дисциплина" options={subjectOptions} value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Select label="Период" options={periodOptions} value={period} onChange={(e) => setPeriod(e.target.value as AttendancePeriod)} />
        <div>
          <Button type="button" onClick={applyFilters}>
            Показать
          </Button>
          <Button type="button" variant="ghost" onClick={resetFilters}>
            Сбросить
          </Button>
        </div>
      </div>

      {summary.length > 0 ? (
        <section className={styles.summary} aria-label="Сводка по дисциплинам">
          {summary.map((s) => (
            <div key={s.subject} className={styles.summaryRow}>
              <div className={styles.summaryHead}>
                <span>{s.subject}</span>
                <span>
                  {s.percent}% · {s.present}/{s.total}
                </span>
              </div>
              <div className={styles.bar}>
                <div className={barClass(s.percent)} style={{ width: `${s.percent}%` }} />
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {rows.length === 0 ? (
        <NoData title="Занятий не найдено" description="Попробуйте другой фильтр." />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Дата</TableHeader>
                  <TableHeader>Дисциплина</TableHeader>
                  <TableHeader>Время</TableHeader>
                  <TableHeader>Статус</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatAttendanceDate(r.date)}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>{r.time}</TableCell>
                    <TableCell>
                      <StatusBadge status={markStatusKey(r.mark)} label={attendanceMarkLabel[r.mark]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={styles.cards}>
            {rows.map((r) => (
              <article key={r.id} className={styles.card}>
                <strong>
                  {formatAttendanceDate(r.date)} · {r.subject}
                </strong>
                <p>{r.time}</p>
                <StatusBadge status={markStatusKey(r.mark)} label={attendanceMarkLabel[r.mark]} />
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
}
