/**
 * @file Месячный календарь мероприятий (студент / родитель).
 */

import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/apiClient'
import { daysInMonth, formatIsoDate, parseIsoDate, shiftMonth } from '@/dates'
import { fetchMonthEvents, isEventsApiEnabled, type CampusEventDto } from '@/events'
import { Button, Loader, LoadError, Modal, NoData } from '@/ui'
import styles from './events-calendar.module.css'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

const MONTH_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
] as const

type DayCell = {
  key: string
  iso: string
  day: number
  inMonth: boolean
}

type EventSegment = {
  key: string
  event: CampusEventDto
  startCol: number
  span: number
  label: string
  dateLabel: string
}

function buildMonthGrid(year: number, monthIndex: number): DayCell[] {
  const first = new Date(year, monthIndex, 1)
  const mondayOffset = (first.getDay() + 6) % 7
  const totalDays = daysInMonth(year, monthIndex)
  const cells: DayCell[] = []

  for (let i = 0; i < mondayOffset; i++) {
    const d = new Date(year, monthIndex, 1 - (mondayOffset - i))
    cells.push({
      key: `pad-${formatIsoDate(d)}`,
      iso: formatIsoDate(d),
      day: d.getDate(),
      inMonth: false,
    })
  }
  for (let day = 1; day <= totalDays; day++) {
    const iso = formatIsoDate(new Date(year, monthIndex, day))
    cells.push({ key: iso, iso, day, inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = parseIsoDate(cells[cells.length - 1]!.iso)
    last.setDate(last.getDate() + 1)
    const iso = formatIsoDate(last)
    cells.push({ key: `pad-${iso}`, iso, day: last.getDate(), inMonth: false })
  }
  return cells
}

function segmentDateLabel(segStart: string, segEnd: string): string {
  const a = parseIsoDate(segStart).getDate()
  const b = parseIsoDate(segEnd).getDate()
  return a === b ? String(a) : `${a}–${b}`
}

function buildSegmentsByWeek(events: CampusEventDto[], cells: DayCell[]): Map<number, EventSegment[]> {
  const weekCount = Math.ceil(cells.length / 7)
  const map = new Map<number, EventSegment[]>()
  for (let i = 0; i < weekCount; i++) map.set(i, [])

  for (const event of events) {
    let cursor = parseIsoDate(event.startDate)
    const end = parseIsoDate(event.endDate)
    while (cursor <= end) {
      const iso = formatIsoDate(cursor)
      const flatIndex = cells.findIndex((c) => c.inMonth && c.iso === iso)
      if (flatIndex < 0) {
        cursor.setDate(cursor.getDate() + 1)
        continue
      }
      const weekIndex = Math.floor(flatIndex / 7)
      const weekEnd = weekIndex * 7 + 6
      let lastInWeek = flatIndex
      let probe = new Date(cursor)
      while (true) {
        const next = new Date(probe)
        next.setDate(next.getDate() + 1)
        if (next > end) break
        const nextIndex = cells.findIndex((c) => c.inMonth && c.iso === formatIsoDate(next))
        if (nextIndex < 0 || nextIndex > weekEnd) break
        lastInWeek = nextIndex
        probe = next
      }
      const startCol = flatIndex % 7
      const span = lastInWeek - flatIndex + 1
      const segStart = cells[flatIndex]!.iso
      const segEnd = cells[lastInWeek]!.iso
      map.get(weekIndex)!.push({
        key: `${event.id}@${segStart}`,
        event,
        startCol,
        span,
        label: event.title,
        dateLabel: segmentDateLabel(segStart, segEnd),
      })
      cursor = new Date(probe)
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return map
}

type Props = {
  subtitle?: string
}

export function EventsCalendar({ subtitle }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [events, setEvents] = useState<CampusEventDto[]>([])
  const [loading, setLoading] = useState(isEventsApiEnabled())
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [selected, setSelected] = useState<CampusEventDto | null>(null)

  const monthNumber = monthIndex + 1

  useEffect(() => {
    if (!isEventsApiEnabled()) {
      setLoading(false)
      setEvents([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const rows = await fetchMonthEvents(year, monthNumber)
        if (!cancelled) setEvents(rows)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Не удалось загрузить календарь')
          setEvents([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [year, monthNumber, reloadTick])

  const cells = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex])
  const weeks = useMemo(() => {
    const rows: DayCell[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cells])
  const segmentsByWeek = useMemo(() => buildSegmentsByWeek(events, cells), [events, cells])

  const goMonth = (delta: -1 | 1) => {
    const next = shiftMonth(year, monthIndex, delta)
    setYear(next.year)
    setMonthIndex(next.month)
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Календарь <span className={styles.monthAccent}>{MONTH_GENITIVE[monthIndex]}</span>
          </h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        <div className={styles.nav}>
          <Button type="button" variant="secondary" size="sm" onClick={() => goMonth(-1)} aria-label="Предыдущий месяц">
            ←
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => goMonth(1)} aria-label="Следующий месяц">
            →
          </Button>
        </div>
      </header>

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d} className={styles.weekday}>
            {d}
          </span>
        ))}
      </div>

      {loading ? <Loader /> : null}
      {!loading && error ? (
        <LoadError message={error} onRetry={() => setReloadTick((n) => n + 1)} />
      ) : null}
      {!loading && !error && !isEventsApiEnabled() ? (
        <NoData title="Календарь недоступен" description="Подключите API, чтобы видеть мероприятия." />
      ) : null}

      {!loading && !error && isEventsApiEnabled() ? (
        <div className={styles.weeks}>
          {weeks.map((week, weekIndex) => {
            const segs = segmentsByWeek.get(weekIndex) ?? []
            const covered = new Set<string>()
            for (const seg of segs) {
              const startIdx = weekIndex * 7 + seg.startCol
              for (let i = 0; i < seg.span; i++) {
                const cell = cells[startIdx + i]
                if (cell?.inMonth) covered.add(cell.iso)
              }
            }
            return (
              <div key={`w-${weekIndex}`} className={styles.week}>
                {week.map((cell) => {
                  if (!cell.inMonth) return <div key={cell.key} className={styles.pad} />
                  if (covered.has(cell.iso)) {
                    return <div key={cell.key} className={styles.slotOccupied} aria-hidden="true" />
                  }
                  return (
                    <div key={cell.key} className={styles.dayEmpty}>
                      <span className={styles.dayNum}>{cell.day}</span>
                    </div>
                  )
                })}
                {segs.map((seg) => (
                  <button
                    key={seg.key}
                    type="button"
                    className={styles.eventTile}
                    style={{ gridColumn: `${seg.startCol + 1} / span ${seg.span}` }}
                    onClick={() => setSelected(seg.event)}
                  >
                    <span className={styles.eventTitle}>{seg.label}</span>
                    <span className={styles.eventDate}>{seg.dateLabel}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      ) : null}

      {!loading && !error && isEventsApiEnabled() && events.length === 0 ? (
        <p className={styles.emptyHint}>В этом месяце мероприятий пока нет.</p>
      ) : null}

      <Modal open={Boolean(selected)} title={selected?.title ?? ''} onClose={() => setSelected(null)}>
        {selected ? (
          <div className={styles.detail}>
            <p className={styles.detailDates}>
              {selected.startDate === selected.endDate
                ? selected.startDate
                : `${selected.startDate} — ${selected.endDate}`}
            </p>
            {selected.description ? (
              <p className={styles.detailBody}>{selected.description}</p>
            ) : (
              <p className={styles.detailBodyMuted}>Без описания</p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
