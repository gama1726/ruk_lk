/**
 * @file Электронный журнал текущего контроля (mock → 1С).
 */

import { useMemo, useState } from 'react'
import { programLabel } from '@/mocks/format'
import {
  filterJournal,
  formatJournalDate,
  formatJournalMark,
  journalPeriods,
  journalSubjects,
  journalSummary,
  markStatusKey,
  type JournalPeriod,
} from '@/mocks/e-journal'
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
import styles from './e-journal.module.css'

/**
 * Журнал: сводка по дисциплинам и записи занятий с текущими баллами.
 */
export function EJournal() {
  const program = useCurrentProgram()
  const subjects = useMemo(() => journalSubjects(program.id), [program.id])

  const [subject, setSubject] = useState('all')
  const [period, setPeriod] = useState<JournalPeriod>('2026-spring')
  const [appliedSubject, setAppliedSubject] = useState('all')
  const [appliedPeriod, setAppliedPeriod] = useState<JournalPeriod>('2026-spring')

  const summary = journalSummary(program.id)
  const rows = filterJournal(program.id, appliedSubject, appliedPeriod)

  const subjectOptions = [
    { value: 'all', label: 'Все дисциплины' },
    ...subjects.map((s) => ({ value: s, label: s })),
  ]
  const periodOptions = journalPeriods.map((p) => ({ value: p.id, label: p.label }))

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

  return (
    <>
      <ScreenHeader
        title="Электронный журнал (dev)"
        subtitle={programLabel(program)}
      />

      <div className={styles.filters}>
        <Select
          label="Дисциплина"
          options={subjectOptions}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Select
          label="Период"
          options={periodOptions}
          value={period}
          onChange={(e) => setPeriod(e.target.value as JournalPeriod)}
        />
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
            <div key={s.subject} className={styles.summaryCard}>
              <p className={styles.summaryTitle}>{s.subject}</p>
              <p className={styles.summaryMeta}>
                Средний балл (из 5): {s.average != null ? s.average : '—'}
              </p>
              <p className={styles.summaryMeta}>
                Оценок: {s.graded}/{s.total}
                {s.lastMark != null ? ` · последняя: ${s.lastMark}` : ''}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      {rows.length === 0 ? (
        <NoData title="Записей не найдено" description="Попробуйте другой фильтр." />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Дата</TableHeader>
                  <TableHeader>Дисциплина</TableHeader>
                  <TableHeader>Вид</TableHeader>
                  <TableHeader>Тема</TableHeader>
                  <TableHeader>Преподаватель</TableHeader>
                  <TableHeader>Оценка</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatJournalDate(r.date)}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>{r.kind}</TableCell>
                    <TableCell>{r.topic}</TableCell>
                    <TableCell>{r.teacher}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={markStatusKey(r.mark, r.maxPoints)}
                        label={formatJournalMark(r)}
                      />
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
                  {formatJournalDate(r.date)} · {r.subject}
                </strong>
                <p>
                  {r.kind} · {r.topic}
                </p>
                <p className={styles.cardMeta}>{r.teacher}</p>
                <StatusBadge
                  status={markStatusKey(r.mark, r.maxPoints)}
                  label={formatJournalMark(r)}
                />
              </article>
            ))}
          </div>
        </>
      )}
    </>
  )
}
