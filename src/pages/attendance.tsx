import { useMemo, useState } from 'react'
import { programLabel } from '@/mocks/format'
import {
  attendancePeriodPresets,
  attendanceSummaryForRange,
  filterAttendanceDays,
  formatAttendanceDate,
  formatStayDuration,
} from '@/mocks/attendance'
import { useCurrentProgram } from '@/study'
import {
  ScreenHeader,
  Select,
  Button,
  Input,
  NoData,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/ui'
import styles from './attendance.module.css'

const DEFAULT_PRESET = attendancePeriodPresets[0]

/**
 * Выгрузка проходов в вуз: приход и уход по дням за выбранный период.
 */
export function Attendance() {
  const program = useCurrentProgram()

  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id)
  const [from, setFrom] = useState(DEFAULT_PRESET.from)
  const [to, setTo] = useState(DEFAULT_PRESET.to)
  const [appliedFrom, setAppliedFrom] = useState(DEFAULT_PRESET.from)
  const [appliedTo, setAppliedTo] = useState(DEFAULT_PRESET.to)

  const rows = useMemo(
    () => filterAttendanceDays(appliedFrom, appliedTo),
    [appliedFrom, appliedTo],
  )
  const summary = useMemo(
    () => attendanceSummaryForRange(appliedFrom, appliedTo),
    [appliedFrom, appliedTo],
  )

  const presetOptions = attendancePeriodPresets.map((p) => ({ value: p.id, label: p.label }))

  const onPresetChange = (id: string) => {
    setPresetId(id)
    const preset = attendancePeriodPresets.find((p) => p.id === id)
    if (!preset || preset.id === 'custom') return
    setFrom(preset.from)
    setTo(preset.to)
  }

  const applyFilters = () => {
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  const resetFilters = () => {
    setPresetId(DEFAULT_PRESET.id)
    setFrom(DEFAULT_PRESET.from)
    setTo(DEFAULT_PRESET.to)
    setAppliedFrom(DEFAULT_PRESET.from)
    setAppliedTo(DEFAULT_PRESET.to)
  }

  return (
    <>
      <ScreenHeader
        title="Посещаемость"
        subtitle={`${programLabel(program)} · проходы на территорию вуза`}
      />

      <div className={styles.filters}>
        <Select
          label="Период"
          options={presetOptions}
          value={presetId}
          onChange={(e) => onPresetChange(e.target.value)}
        />
        <Input
          label="С даты"
          type="date"
          value={from}
          onChange={(e) => {
            setPresetId('custom')
            setFrom(e.target.value)
          }}
        />
        <Input
          label="По дату"
          type="date"
          value={to}
          onChange={(e) => {
            setPresetId('custom')
            setTo(e.target.value)
          }}
        />
        <div className={styles.filterActions}>
          <Button type="button" onClick={applyFilters}>
            Показать
          </Button>
          <Button type="button" variant="ghost" onClick={resetFilters}>
            Сбросить
          </Button>
        </div>
      </div>

      {summary.days > 0 ? (
        <section className={styles.summary} aria-label="Сводка за период">
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Дней в вузе</span>
            <span className={styles.summaryValue}>{summary.days}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Самый ранний приход</span>
            <span className={styles.summaryValue}>{summary.earliest}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Самый поздний уход</span>
            <span className={styles.summaryValue}>{summary.latest}</span>
          </div>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <NoData
          title="Нет проходов"
          description="За выбранный период отметок о приходе и уходе нет."
        />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Дата</TableHeader>
                  <TableHeader>Пришёл в вуз</TableHeader>
                  <TableHeader>Ушёл из вуза</TableHeader>
                  <TableHeader>Время в вузе</TableHeader>
                  <TableHeader>КПП</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatAttendanceDate(r.date)}</TableCell>
                    <TableCell className={styles.timeCell}>{r.checkIn}</TableCell>
                    <TableCell className={styles.timeCell}>{r.checkOut}</TableCell>
                    <TableCell>{formatStayDuration(r.checkIn, r.checkOut)}</TableCell>
                    <TableCell className={styles.gateCell}>{r.gate ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className={styles.cards}>
            {rows.map((r) => (
              <li key={r.id} className={styles.card}>
                <strong>{formatAttendanceDate(r.date)}</strong>
                <p className={styles.cardLine}>
                  Пришёл: <span className={styles.timeCell}>{r.checkIn}</span>
                  {' · '}
                  Ушёл: <span className={styles.timeCell}>{r.checkOut}</span>
                </p>
                <p className={styles.cardLine}>
                  В вузе: {formatStayDuration(r.checkIn, r.checkOut)}
                </p>
                {r.gate ? <p className={styles.cardLine}>{r.gate}</p> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
