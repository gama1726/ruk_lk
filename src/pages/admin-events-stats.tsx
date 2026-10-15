/**
 * @file Статистика ЛК: обзор, филиалы, пользователи (редизайн v3).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import {
  fetchEventsAdminStats,
  fetchEventsAdminUsers,
  type CabinetCampusStats,
  type CabinetStats,
  type CabinetUserListItem,
  type CabinetUserPage,
} from '@/events-admin'
import { Button, Drawer, Loader, LoadError } from '@/ui'
import styles from './admin-lk-stats.module.css'

const PAGE_SIZE = 50
const MAX_RANGE_DAYS = 92
const MOSCOW_TZ = 'Europe/Moscow'

const CAMPUS_CATALOG: Array<{ value: string; label: string }> = [
  { value: 'main', label: 'Голова' },
  { value: 'kazan', label: 'Казань' },
  { value: 'krasnodar', label: 'Краснодар' },
  { value: 'vladimir', label: 'Владимир' },
  { value: 'arzamas', label: 'Арзамас' },
  { value: 'ufa', label: 'Уфа' },
  { value: 'volgograd', label: 'Волгоград' },
  { value: 'izhevsk', label: 'Ижевск' },
  { value: 'kaliningrad', label: 'Калининград' },
  { value: 'pk', label: 'Камчатка' },
  { value: 'crimea', label: 'Крым' },
  { value: 'engels', label: 'Энгельс' },
  { value: 'saransk', label: 'Саранск' },
  { value: 'smolensk', label: 'Смоленск' },
  { value: 'cheb', label: 'Чебоксары' },
  { value: 'UNKNOWN', label: 'Не определён' },
]

type TabId = 'overview' | 'branches' | 'users'

function moscowYmd(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: MOSCOW_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Сдвиг календарной даты YYYY-MM-DD на N дней (без UTC-сдвига «сегодня»). */
function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d + days, 12, 0, 0)
  return moscowYmd(new Date(utc))
}

function defaultRange(): { from: string; to: string } {
  const to = moscowYmd()
  return { from: shiftYmd(to, -29), to }
}

function parseYmd(ymd: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null
  const [y, m, d] = ymd.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d)
  if (Number.isNaN(t)) return null
  return t
}

function inclusiveDaySpan(from: string, to: string): number | null {
  const a = parseYmd(from)
  const b = parseYmd(to)
  if (a == null || b == null) return null
  return Math.floor((b - a) / 86_400_000) + 1
}

function fmtInt(n: number): string {
  return n.toLocaleString('ru-RU')
}

function fmtPct(part: number, whole: number): string {
  if (whole <= 0) return '—'
  return `${((part / whole) * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`
}

function formatInstant(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ru-RU', {
    timeZone: MOSCOW_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatChartDay(isoDate: string): string {
  const parts = isoDate.split('-')
  return parts[2] ?? isoDate
}

function roleLabel(role: string): string {
  return role === 'PARENT' ? 'Родитель' : 'Студент'
}

function campusLabel(id: string | null | undefined, fallback?: string): string {
  if (!id) return fallback ?? 'Не определён'
  const known = CAMPUS_CATALOG.find((c) => c.value === id)
  return known?.label ?? fallback ?? id
}

function csvEscape(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  if (/[;"\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const body = rows.map((row) => row.map(csvEscape).join(';')).join('\r\n')
  const blob = new Blob([`\ufeff${body}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1200)
}

function parseTab(raw: string | null): TabId {
  if (raw === 'branches' || raw === 'users' || raw === 'overview') return raw
  return 'overview'
}

export function AdminEventsStats() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = defaultRange()

  const [fromDraft, setFromDraft] = useState(() => searchParams.get('from') || initial.from)
  const [toDraft, setToDraft] = useState(() => searchParams.get('to') || initial.to)
  const [campusDraft, setCampusDraft] = useState(() => searchParams.get('campus') || '')
  const [appliedFrom, setAppliedFrom] = useState(fromDraft)
  const [appliedTo, setAppliedTo] = useState(toDraft)
  const [appliedCampus, setAppliedCampus] = useState(campusDraft)
  const [tab, setTab] = useState<TabId>(() => parseTab(searchParams.get('tab')))
  const [filterError, setFilterError] = useState<string | null>(null)

  const [role, setRole] = useState('')
  const [q, setQ] = useState('')
  const [appliedQ, setAppliedQ] = useState('')
  const [page, setPage] = useState(0)

  const [stats, setStats] = useState<CabinetStats | null>(null)
  const [users, setUsers] = useState<CabinetUserPage | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<CabinetUserListItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const statsAbort = useRef<AbortController | null>(null)
  const usersAbort = useRef<AbortController | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2400)
  }

  const syncUrl = useCallback(
    (next: { from: string; to: string; campus: string; tab: TabId }) => {
      const params = new URLSearchParams()
      params.set('tab', next.tab)
      params.set('from', next.from)
      params.set('to', next.to)
      if (next.campus) params.set('campus', next.campus)
      setSearchParams(params, { replace: true })
    },
    [setSearchParams],
  )

  const validateRange = (from: string, to: string): string | null => {
    if (!from || !to) return 'Укажите обе даты периода'
    const span = inclusiveDaySpan(from, to)
    if (span == null) return 'Некорректные даты'
    if (span < 1) return 'Дата «с» не может быть позже даты «по»'
    if (span > MAX_RANGE_DAYS) return `Период не больше ${MAX_RANGE_DAYS} дней`
    return null
  }

  const applyFilters = (next?: { from?: string; to?: string; campus?: string; tab?: TabId }) => {
    const from = next?.from ?? fromDraft
    const to = next?.to ?? toDraft
    const campus = next?.campus ?? campusDraft
    const nextTab = next?.tab ?? tab
    const err = validateRange(from, to)
    if (err) {
      setFilterError(err)
      return
    }
    setFilterError(null)
    setFromDraft(from)
    setToDraft(to)
    setCampusDraft(campus)
    setAppliedFrom(from)
    setAppliedTo(to)
    setAppliedCampus(campus)
    setTab(nextTab)
    setPage(0)
    syncUrl({ from, to, campus, tab: nextTab })
  }

  const resetFilters = () => {
    const range = defaultRange()
    setRole('')
    setQ('')
    setAppliedQ('')
    applyFilters({ from: range.from, to: range.to, campus: '', tab })
  }

  const setPresetDays = (days: number) => {
    const to = moscowYmd()
    const from = shiftYmd(to, -(days - 1))
    setFromDraft(from)
    setToDraft(to)
    applyFilters({ from, to, campus: campusDraft, tab })
  }

  const loadStats = useCallback(async () => {
    statsAbort.current?.abort()
    const ac = new AbortController()
    statsAbort.current = ac
    setLoadingStats(true)
    setStatsError(null)
    try {
      const data = await fetchEventsAdminStats(appliedFrom, appliedTo, appliedCampus || undefined)
      if (!ac.signal.aborted) setStats(data)
    } catch (err) {
      if (ac.signal.aborted) return
      setStatsError(err instanceof ApiError ? err.message : 'Не удалось загрузить статистику')
    } finally {
      if (!ac.signal.aborted) setLoadingStats(false)
    }
  }, [appliedFrom, appliedTo, appliedCampus])

  const loadUsers = useCallback(async () => {
    usersAbort.current?.abort()
    const ac = new AbortController()
    usersAbort.current = ac
    setLoadingUsers(true)
    setUsersError(null)
    try {
      const data = await fetchEventsAdminUsers({
        page,
        size: PAGE_SIZE,
        campus: appliedCampus || undefined,
        role: role || undefined,
        q: appliedQ || undefined,
      })
      if (!ac.signal.aborted) setUsers(data)
    } catch (err) {
      if (ac.signal.aborted) return
      setUsersError(err instanceof ApiError ? err.message : 'Не удалось загрузить пользователей')
    } finally {
      if (!ac.signal.aborted) setLoadingUsers(false)
    }
  }, [page, appliedCampus, role, appliedQ])

  useEffect(() => {
    void loadStats()
    return () => statsAbort.current?.abort()
  }, [loadStats])

  useEffect(() => {
    void loadUsers()
    return () => usersAbort.current?.abort()
  }, [loadUsers])

  // Первичная запись фильтров в URL, если их ещё нет
  useEffect(() => {
    if (!searchParams.get('from') || !searchParams.get('to')) {
      syncUrl({ from: appliedFrom, to: appliedTo, campus: appliedCampus, tab })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const urlTab = parseTab(searchParams.get('tab'))
    const urlFrom = searchParams.get('from')
    const urlTo = searchParams.get('to')
    const urlCampus = searchParams.get('campus') || ''
    setTab(urlTab)
    if (urlFrom && urlTo && (urlFrom !== appliedFrom || urlTo !== appliedTo)) {
      const err = validateRange(urlFrom, urlTo)
      if (!err) {
        setFromDraft(urlFrom)
        setToDraft(urlTo)
        setAppliedFrom(urlFrom)
        setAppliedTo(urlTo)
        setPage(0)
      }
    }
    if (urlCampus !== appliedCampus) {
      setCampusDraft(urlCampus)
      setAppliedCampus(urlCampus)
      setPage(0)
    }
    // Back/Forward синхронизация
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const networkTotal = useMemo(() => {
    if (!stats) return 0
    return stats.byCampus.reduce((sum, row) => sum + row.total, 0)
  }, [stats])

  const networkNew = useMemo(() => {
    if (!stats) return 0
    return stats.byCampus.reduce((sum, row) => sum + row.newInRange, 0)
  }, [stats])

  const visibleCampuses = useMemo(() => {
    if (!stats) return [] as CabinetCampusStats[]
    const rows = [...stats.byCampus].sort((a, b) => b.total - a.total)
    if (!appliedCampus) return rows
    return rows.filter((row) => row.campus === appliedCampus)
  }, [stats, appliedCampus])

  const campusOptions = useMemo(() => {
    const map = new Map(CAMPUS_CATALOG.map((c) => [c.value, c.label]))
    for (const row of stats?.byCampus ?? []) {
      if (!map.has(row.campus)) map.set(row.campus, row.label || row.campus)
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [stats])

  const maxSeries = useMemo(() => {
    if (!stats?.series.length) return 1
    return Math.max(1, ...stats.series.map((d) => d.total))
  }, [stats])

  const branchCount = useMemo(() => {
    if (!stats) return 0
    if (appliedCampus) return visibleCampuses.length
    return stats.byCampus.filter((c) => c.total > 0).length
  }, [stats, appliedCampus, visibleCampuses])

  const onlineLabelMinutes = stats?.onlineWindowMinutes ?? 15

  const selectCampus = (campus: string) => {
    applyFilters({ campus, tab: 'overview' })
  }

  const switchTab = (next: TabId) => {
    setTab(next)
    syncUrl({ from: appliedFrom, to: appliedTo, campus: appliedCampus, tab: next })
  }

  const onExport = () => {
    if (!stats) return
    const rows: Array<Array<string | number>> = [
      [
        'Филиал',
        'Всего в ЛК',
        'Первые входы за период',
        `Активны за ${onlineLabelMinutes} минут`,
        'Доля базы',
      ],
      ...visibleCampuses.map((row) => [
        row.label,
        row.total,
        row.newInRange,
        row.online,
        networkTotal > 0 ? `${((row.total / networkTotal) * 100).toFixed(1)}%` : '',
      ]),
      [
        'Итого',
        visibleCampuses.reduce((s, r) => s + r.total, 0),
        visibleCampuses.reduce((s, r) => s + r.newInRange, 0),
        visibleCampuses.reduce((s, r) => s + r.online, 0),
        appliedCampus ? fmtPct(
          visibleCampuses.reduce((s, r) => s + r.total, 0),
          networkTotal,
        ) : '100%',
      ],
    ]
    downloadCsv(`statistika-lk_${appliedFrom}_${appliedTo}.csv`, rows)
    showToast('Сводка экспортирована')
  }

  const maxTotalBar = Math.max(1, ...visibleCampuses.map((r) => r.total), 1)
  const maxNewBar = Math.max(1, ...visibleCampuses.map((r) => r.newInRange), 1)

  return (
    <section className={styles.page} aria-label="Статистика ЛК">
      <div className={styles.top}>
        <div>
          <p className={styles.overline}>Личный кабинет / Аналитика</p>
          <h1 className={styles.title}>Статистика ЛК</h1>
          <p className={styles.lead}>Пользователи, первые входы и активность по филиалам</p>
        </div>
        <div className={styles.topActions}>
          <Button type="button" onClick={onExport} disabled={!stats || loadingStats}>
            Экспорт
          </Button>
        </div>
      </div>

      <div className={styles.filterbar}>
        <div className={styles.field}>
          <label htmlFor="stats-from">Период с</label>
          <input
            id="stats-from"
            className={styles.control}
            type="date"
            value={fromDraft}
            onChange={(e) => setFromDraft(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="stats-to">По</label>
          <input
            id="stats-to"
            className={styles.control}
            type="date"
            value={toDraft}
            onChange={(e) => setToDraft(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="stats-campus">Филиал</label>
          <select
            id="stats-campus"
            className={styles.control}
            value={campusDraft}
            onChange={(e) => setCampusDraft(e.target.value)}
          >
            <option value="">Все филиалы</option>
            {campusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.presets}>
          <button type="button" className={styles.preset} onClick={() => setPresetDays(7)}>
            7 дней
          </button>
          <button type="button" className={styles.preset} onClick={() => setPresetDays(30)}>
            30 дней
          </button>
          <button type="button" className={styles.preset} onClick={() => setPresetDays(90)}>
            90 дней
          </button>
        </div>
        <Button type="button" onClick={() => applyFilters()} disabled={loadingStats || loadingUsers}>
          Показать
        </Button>
        <Button type="button" variant="secondary" onClick={resetFilters} disabled={loadingStats || loadingUsers}>
          Сбросить
        </Button>
        {filterError ? <p className={styles.filterError}>{filterError}</p> : null}
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Разделы статистики">
        {(
          [
            ['overview', 'Обзор'],
            ['branches', 'Филиалы'],
            ['users', 'Пользователи'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
            onClick={() => switchTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          {loadingStats ? <Loader /> : null}
          {!loadingStats && statsError ? (
            <LoadError message={statsError} onRetry={() => void loadStats()} />
          ) : null}
          {!loadingStats && !statsError && stats ? (
            <>
              <div className={styles.kpis}>
                <article className={styles.kpi}>
                  <div className={styles.kpiTop}>
                    Всего в ЛК
                    <span className={styles.kpiMark} aria-hidden="true">
                      ♙
                    </span>
                  </div>
                  <strong className={styles.kpiValue}>{fmtInt(stats.totalRegistered)}</strong>
                  <small className={styles.kpiHint}>Учётные записи</small>
                </article>
                <article className={styles.kpi}>
                  <div className={styles.kpiTop}>
                    Новые за период
                    <span className={styles.kpiMark} aria-hidden="true">
                      ↗
                    </span>
                  </div>
                  <strong className={styles.kpiValue}>{fmtInt(stats.newInRange)}</strong>
                  <small className={styles.kpiHint}>Впервые вошли в ЛК</small>
                </article>
                <article className={styles.kpi}>
                  <div className={styles.kpiTop}>
                    Активны за {onlineLabelMinutes} минут
                    <span className={styles.kpiMark} aria-hidden="true">
                      ◷
                    </span>
                  </div>
                  <strong className={styles.kpiValue}>{fmtInt(stats.onlineNow)}</strong>
                  <small className={styles.kpiHint}>Недавняя активность</small>
                </article>
                <article className={styles.kpi}>
                  <div className={styles.kpiTop}>
                    Филиалов
                    <span className={styles.kpiMark} aria-hidden="true">
                      ▦
                    </span>
                  </div>
                  <strong className={styles.kpiValue}>{fmtInt(branchCount)}</strong>
                  <small className={styles.kpiHint}>С пользователями ЛК</small>
                </article>
              </div>

              <section className={styles.panel}>
                <div className={styles.panelHead}>
                  <div>
                    <h2 className={styles.panelTitle}>Новые пользователи по дням</h2>
                    <p className={styles.panelSub}>Первые входы студентов и родителей за выбранный период</p>
                  </div>
                  <div className={styles.legend}>
                    <span className={styles.legendItem}>
                      <i className={`${styles.legendDot} ${styles.legendStudent}`} /> Студенты
                    </span>
                    <span className={styles.legendItem}>
                      <i className={`${styles.legendDot} ${styles.legendParent}`} /> Родители
                    </span>
                  </div>
                </div>
                <div
                  className={styles.chartWrap}
                  role="img"
                  aria-label="Новые пользователи по дням"
                  style={{ ['--days' as string]: String(Math.max(1, stats.series.length)) }}
                >
                  {stats.series.every((d) => d.total === 0) ? (
                    <div className={styles.chartEmpty}>Нет данных за выбранный период</div>
                  ) : (
                    <>
                      <div className={styles.chartGraph}>
                        {stats.series.map((day) => {
                          const studentH = (day.students / maxSeries) * 100
                          const parentH = (day.parents / maxSeries) * 100
                          return (
                            <div
                              key={day.date}
                              className={`${styles.chartDay} ${styles.chartDayInteractive}`}
                              title={`${day.date}: студенты ${day.students}, родители ${day.parents}, всего ${day.total}`}
                              tabIndex={0}
                            >
                              <div className={styles.chartStack}>
                                <span
                                  className={`${styles.chartPart} ${styles.chartStudent}`}
                                  style={{ height: `${studentH}%` }}
                                />
                                <span
                                  className={`${styles.chartPart} ${styles.chartParent}`}
                                  style={{ height: `${parentH}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className={styles.chartDays}>
                        {stats.series.map((day, index) => {
                          const show =
                            index === 0 ||
                            index === stats.series.length - 1 ||
                            index === Math.floor((stats.series.length - 1) / 2) ||
                            index % 5 === 0
                          return (
                            <span key={day.date} style={{ color: show ? undefined : 'transparent' }}>
                              {formatChartDay(day.date)}
                            </span>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </section>

              <div className={styles.cols}>
                <section className={styles.panel}>
                  <div className={styles.panelHead}>
                    <div>
                      <h2 className={styles.panelTitle}>Пользователи по филиалам</h2>
                      <p className={styles.panelSub}>Распределение аудитории ЛК</p>
                    </div>
                    <span className={styles.chip}>Всего пользователей</span>
                  </div>
                  <div className={styles.rows}>
                    {visibleCampuses.map((row) => (
                      <button
                        key={`total-${row.campus}`}
                        type="button"
                        className={styles.branchBar}
                        onClick={() => selectCampus(row.campus === 'UNKNOWN' ? 'UNKNOWN' : row.campus)}
                      >
                        <span className={styles.branchName}>{row.label}</span>
                        <span className={styles.track}>
                          <span
                            className={styles.fill}
                            style={{ width: `${(row.total / maxTotalBar) * 100}%` }}
                          />
                        </span>
                        <span>
                          <span className={styles.branchVal}>{fmtInt(row.total)}</span>
                          <span className={styles.branchNote}>{fmtPct(row.total, networkTotal)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHead}>
                    <div>
                      <h2 className={styles.panelTitle}>Новые по филиалам</h2>
                      <p className={styles.panelSub}>Первые входы за выбранный период</p>
                    </div>
                    <span className={styles.chip}>За период</span>
                  </div>
                  <div className={styles.rows}>
                    {[...visibleCampuses]
                      .sort((a, b) => b.newInRange - a.newInRange)
                      .map((row) => (
                        <button
                          key={`new-${row.campus}`}
                          type="button"
                          className={styles.branchBar}
                          onClick={() => selectCampus(row.campus === 'UNKNOWN' ? 'UNKNOWN' : row.campus)}
                        >
                          <span className={styles.branchName}>{row.label}</span>
                          <span className={styles.track}>
                            <span
                              className={`${styles.fill} ${styles.fillNew}`}
                              style={{ width: `${(row.newInRange / maxNewBar) * 100}%` }}
                            />
                          </span>
                          <span>
                            <span className={styles.branchVal}>{fmtInt(row.newInRange)}</span>
                            <span className={styles.branchNote}>{fmtPct(row.newInRange, networkNew)}</span>
                          </span>
                        </button>
                      ))}
                  </div>
                </section>
              </div>

              <div className={styles.quickPanel}>
                <div>
                  <b>Список пользователей</b>
                  <span>Поиск по ФИО или зачётке, фильтр роли и филиала</span>
                </div>
                <Button type="button" variant="secondary" onClick={() => switchTab('users')}>
                  Открыть пользователей →
                </Button>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {tab === 'branches' ? (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Статистика по филиалам</h2>
              <p className={styles.panelSub}>Сравнение количества пользователей, первых входов и активности</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => applyFilters({ campus: '' })}
              disabled={!appliedCampus}
            >
              Показать все филиалы
            </Button>
          </div>
          {loadingStats ? <Loader /> : null}
          {!loadingStats && statsError ? (
            <LoadError message={statsError} onRetry={() => void loadStats()} />
          ) : null}
          {!loadingStats && !statsError && stats ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Филиал</th>
                    <th className={styles.num}>Всего в ЛК</th>
                    <th className={styles.num}>Первые входы за период</th>
                    <th className={styles.num}>Активны за {onlineLabelMinutes} минут</th>
                    <th className={styles.num}>Доля базы</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCampuses.map((row) => (
                    <tr
                      key={row.campus}
                      className={styles.clickable}
                      tabIndex={0}
                      onClick={() => selectCampus(row.campus)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          selectCampus(row.campus)
                        }
                      }}
                    >
                      <td>
                        <b>{row.label}</b>
                      </td>
                      <td className={styles.num}>{fmtInt(row.total)}</td>
                      <td className={styles.num}>{fmtInt(row.newInRange)}</td>
                      <td className={styles.num}>{fmtInt(row.online)}</td>
                      <td className={styles.num}>{fmtPct(row.total, networkTotal)}</td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>Итого</td>
                    <td className={styles.num}>
                      {fmtInt(visibleCampuses.reduce((s, r) => s + r.total, 0))}
                    </td>
                    <td className={styles.num}>
                      {fmtInt(visibleCampuses.reduce((s, r) => s + r.newInRange, 0))}
                    </td>
                    <td className={styles.num}>
                      {fmtInt(visibleCampuses.reduce((s, r) => s + r.online, 0))}
                    </td>
                    <td className={styles.num}>
                      {appliedCampus
                        ? fmtPct(
                            visibleCampuses.reduce((s, r) => s + r.total, 0),
                            networkTotal,
                          )
                        : '100%'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'users' ? (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2 className={styles.panelTitle}>Пользователи</h2>
              <p className={styles.panelSub}>Поиск и просмотр активности пользователей личного кабинета</p>
            </div>
            <div className={styles.toolbar}>
              <div className={styles.field}>
                <label htmlFor="stats-role">Роль</label>
                <select
                  id="stats-role"
                  className={styles.control}
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value)
                    setPage(0)
                  }}
                >
                  <option value="">Все роли</option>
                  <option value="STUDENT">Студенты</option>
                  <option value="PARENT">Родители</option>
                </select>
              </div>
              <div className={`${styles.field} ${styles.searchField}`}>
                <label htmlFor="stats-q">Поиск</label>
                <input
                  id="stats-q"
                  className={styles.control}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ФИО или зачётка"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setAppliedQ(q)
                      setPage(0)
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  setAppliedQ(q)
                  setPage(0)
                }}
                disabled={loadingUsers}
              >
                Найти
              </Button>
            </div>
          </div>

          {loadingUsers ? <Loader /> : null}
          {!loadingUsers && usersError ? (
            <LoadError message={usersError} onRetry={() => void loadUsers()} />
          ) : null}

          {!loadingUsers && !usersError && users ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Пользователь</th>
                      <th>Роль</th>
                      <th>Зачётка</th>
                      <th>Филиал</th>
                      <th>Первый вход</th>
                      <th>Последний вход</th>
                      <th>Последняя активность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.empty}>
                          Пользователи не найдены
                        </td>
                      </tr>
                    ) : (
                      users.items.map((u) => (
                        <tr
                          key={u.id}
                          className={styles.clickable}
                          tabIndex={0}
                          onClick={() => setSelectedUser(u)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedUser(u)
                            }
                          }}
                        >
                          <td>
                            <b>{u.displayName}</b>
                          </td>
                          <td>
                            <span
                              className={`${styles.tag} ${u.role === 'PARENT' ? styles.tagParent : ''}`}
                            >
                              {roleLabel(u.role)}
                            </span>
                          </td>
                          <td>{u.studentId}</td>
                          <td>{u.campusLabel || campusLabel(u.campus)}</td>
                          <td>{formatInstant(u.firstLoginAt)}</td>
                          <td>{formatInstant(u.lastLoginAt)}</td>
                          <td>{formatInstant(u.lastSeenAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className={styles.pager}>
                <span>
                  Показано записей: {users.items.length} · всего {fmtInt(users.totalElements)}
                  {users.totalPages > 1 ? ` · стр. ${users.page + 1} из ${users.totalPages}` : ''}
                </span>
                {users.totalPages > 1 ? (
                  <div className={styles.pagerActions}>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={page <= 0 || loadingUsers}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Назад
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={page + 1 >= users.totalPages || loadingUsers}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Вперёд
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      <Drawer
        open={Boolean(selectedUser)}
        title={selectedUser?.displayName ?? 'Пользователь'}
        onClose={() => setSelectedUser(null)}
      >
        {selectedUser ? (
          <dl className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <dt>Роль</dt>
              <dd>{roleLabel(selectedUser.role)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Филиал</dt>
              <dd>{selectedUser.campusLabel || campusLabel(selectedUser.campus)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Зачётка</dt>
              <dd>{selectedUser.studentId}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Первый вход</dt>
              <dd>{formatInstant(selectedUser.firstLoginAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Последний вход</dt>
              <dd>{formatInstant(selectedUser.lastLoginAt)}</dd>
            </div>
            <div className={styles.detailRow}>
              <dt>Последняя активность</dt>
              <dd>{formatInstant(selectedUser.lastSeenAt)}</dd>
            </div>
          </dl>
        ) : null}
      </Drawer>

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </section>
  )
}
