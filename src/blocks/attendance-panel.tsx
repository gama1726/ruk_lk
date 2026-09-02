/**
 * @file UI посещаемости (студент и родитель).
 */

import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  buildAttendancePeriodPresets,
  formatAttendanceDate,
  formatStayDuration,
  isAttendanceAbsent,
  isAttendanceApiEnabled,
  type StudentAttendanceDto,
} from '@/attendance'
import {
  attendancePeriodPresets,
  attendanceSummaryForRange,
  filterAttendanceDays,
} from '@/mocks/attendance'
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
import styles from '@/pages/attendance.module.css'

type FetchAttendance = (from: string, to: string) => Promise<StudentAttendanceDto>

type Props = {
  subtitle: string
  fetchAttendance: FetchAttendance
  enabled?: boolean
}

export function AttendancePanel({ subtitle, fetchAttendance, enabled = true }: Props) {
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
  const [loading, setLoading] = useState(apiEnabled && enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !apiEnabled) {
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
        const result = await fetchAttendance(appliedFrom, appliedTo)
        if (!cancelled) setApiData(result)
      } catch (e) {
        if (!cancelled) {
          setApiData(null)
          setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Не удалось загрузить проходы')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, apiEnabled, appliedFrom, appliedTo, fetchAttendance])

  const rows = useMemo(() => {
    if (apiEnabled) return apiData?.days ?? []
    return filterAttendanceDays(appliedFrom, appliedTo)
  }, [apiEnabled, apiData, appliedFrom, appliedTo])

  const summary = useMemo(() => {
    if (apiEnabled) {
      return (
        apiData?.summary ?? {
          days: 0,
          absentDays: 0,
          earliest: null as string | null,
          latest: null as string | null,
        }
      )
    }
    return attendanceSummaryForRange(appliedFrom, appliedTo)
  }, [apiEnabled, apiData, appliedFrom, appliedTo])

  const absentDays = summary.absentDays ?? 0
  const showSummary = summary.days > 0 || absentDays > 0

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
      <ScreenHeader title="Посещаемость" subtitle={subtitle} />

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

      {!loading && !error && showSummary ? (
        <section className={styles.summary} aria-label="Сводка за период">
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Дней в вузе</span>
            <span className={styles.summaryValue}>{summary.days}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Отсутствий</span>
            <span className={`${styles.summaryValue} ${absentDays > 0 ? styles.summaryAbsent : ''}`}>
              {absentDays}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Самый ранний приход</span>
            <span className={styles.summaryValue}>{summary.earliest ?? '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Самый поздний уход</span>
            <span className={styles.summaryValue}>{summary.latest ?? '—'}</span>
          </div>
        </section>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <NoData
          title="Нет данных"
          description={
            apiEnabled
              ? 'За выбранный период нет проходов СКУД и очных занятий по расписанию.'
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
                  <TableHeader>КПП / статус</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const absent = isAttendanceAbsent(r)
                  return (
                    <TableRow key={r.id} className={absent ? styles.rowAbsent : undefined}>
                      <TableCell>{formatAttendanceDate(r.date)}</TableCell>
                      {absent ? (
                        <TableCell className={styles.absentCell} colSpan={3}>
                          Отсутствовал
                        </TableCell>
                      ) : (
                        <>
                          <TableCell className={styles.timeCell}>{r.checkIn}</TableCell>
                          <TableCell className={styles.timeCell}>{r.checkOut}</TableCell>
                          <TableCell>{formatStayDuration(r.checkIn, r.checkOut)}</TableCell>
                        </>
                      )}
                      <TableCell className={absent ? styles.absentGate : styles.gateCell}>
                        {r.gate ?? '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <ul className={styles.cards}>
            {rows.map((r) => {
              const absent = isAttendanceAbsent(r)
              return (
                <li
                  key={r.id}
                  className={`${styles.card} ${absent ? styles.cardAbsent : ''}`}
                >
                  <strong className={absent ? styles.absentTitle : undefined}>
                    {formatAttendanceDate(r.date)}
                  </strong>
                  {absent ? (
                    <>
                      <p className={styles.absentStatus}>Отсутствовал</p>
                      {r.gate ? <p className={styles.cardLine}>{r.gate}</p> : null}
                    </>
                  ) : (
                    <>
                      <p className={styles.cardLine}>
                        Пришёл: <span className={styles.timeCell}>{r.checkIn}</span>
                        {' · '}
                        Ушёл: <span className={styles.timeCell}>{r.checkOut}</span>
                      </p>
                      <p className={styles.cardLine}>
                        В вузе: {formatStayDuration(r.checkIn, r.checkOut)}
                      </p>
                      {r.gate ? <p className={styles.cardLine}>{r.gate}</p> : null}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      ) : null}
    </>
  )
}
