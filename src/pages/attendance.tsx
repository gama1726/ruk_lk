/**
 * @file Выгрузка проходов в вуз: API (Perco) или мок.
 */

import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/apiClient'
import { programLabel } from '@/mocks/format'
import {
  buildAttendancePeriodPresets,
  fetchStudentAttendance,
  formatAttendanceDate,
  formatStayDuration,
  isAttendanceApiEnabled,
  type StudentAttendanceDto,
} from '@/attendance'
import {
  attendancePeriodPresets,
  attendanceSummaryForRange,
  filterAttendanceDays,
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

/**
 * Выгрузка проходов в вуз: приход и уход по дням за выбранный период.
 */
export function Attendance() {
  const program = useCurrentProgram()
  const apiEnabled = isAttendanceApiEnabled()

  const presets = useMemo(
    () => (apiEnabled ? buildAttendancePeriodPresets() : attendancePeriodPresets),
    [apiEnabled],
  )
  const defaultPreset = presets[0]

  const [presetId, setPresetId] = useState(defaultPreset.id)
  const [from, setFrom] = useState(defaultPreset.from)
  const [to, setTo] = useState(defaultPreset.to)
  const [appliedFrom, setAppliedFrom] = useState(defaultPreset.from)
  const [appliedTo, setAppliedTo] = useState(defaultPreset.to)

  const [apiData, setApiData] = useState<StudentAttendanceDto | null>(null)
  const [loading, setLoading] = useState(apiEnabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiEnabled) {
      setLoading(false)
      return
    }
    if (!appliedFrom || !appliedTo) {
      setApiData(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const result = await fetchStudentAttendance(appliedFrom, appliedTo)
        if (!cancelled) setApiData(result)
      } catch (e) {
        if (!cancelled) {
          setApiData(null)
          setError(e instanceof ApiError ? e.message : 'Не удалось загрузить проходы')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [apiEnabled, appliedFrom, appliedTo])

  const rows = useMemo(() => {
    if (apiEnabled) return apiData?.days ?? []
    return filterAttendanceDays(appliedFrom, appliedTo)
  }, [apiEnabled, apiData, appliedFrom, appliedTo])

  const summary = useMemo(() => {
    if (apiEnabled) {
      return (
        apiData?.summary ?? {
          days: 0,
          earliest: null as string | null,
          latest: null as string | null,
        }
      )
    }
    return attendanceSummaryForRange(appliedFrom, appliedTo)
  }, [apiEnabled, apiData, appliedFrom, appliedTo])

  const presetOptions = presets.map((p) => ({ value: p.id, label: p.label }))

  const onPresetChange = (id: string) => {
    setPresetId(id)
    const preset = presets.find((p) => p.id === id)
    if (!preset || preset.id === 'custom') return
    setFrom(preset.from)
    setTo(preset.to)
  }

  const applyFilters = () => {
    setAppliedFrom(from)
    setAppliedTo(to)
  }

  const resetFilters = () => {
    setPresetId(defaultPreset.id)
    setFrom(defaultPreset.from)
    setTo(defaultPreset.to)
    setAppliedFrom(defaultPreset.from)
    setAppliedTo(defaultPreset.to)
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
          <Button type="button" onClick={applyFilters} disabled={loading}>
            Показать
          </Button>
          <Button type="button" variant="ghost" onClick={resetFilters} disabled={loading}>
            Сбросить
          </Button>
        </div>
      </div>

      {loading ? <p>Загрузка…</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      {!loading && !error && summary.days > 0 ? (
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

      {!loading && !error && rows.length === 0 ? (
        <NoData
          title="Нет проходов"
          description={
            apiEnabled
              ? 'За выбранный период в СКУД нет отметок о приходе и уходе.'
              : 'За выбранный период отметок о приходе и уходе нет.'
          }
        />
      ) : null}

      {!loading && !error && rows.length > 0 ? (
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
      ) : null}
    </>
  )
}
