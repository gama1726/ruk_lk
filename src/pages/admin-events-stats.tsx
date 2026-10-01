/**
 * @file Статистика пользователей ЛК: по филиалам, пагинация списка.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  fetchEventsAdminStats,
  fetchEventsAdminUsers,
  type CabinetStats,
  type CabinetUserPage,
} from '@/events-admin'
import { Button, Input, Loader, LoadError } from '@/ui'
import styles from './admin-events.module.css'

const PAGE_SIZE = 50

/** Как BranchBanner / UniversityBranchCatalog. */
const CAMPUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Все филиалы' },
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

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatInstant(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function roleLabel(role: string): string {
  if (role === 'PARENT') return 'Родитель'
  return 'Студент'
}

export function AdminEventsStats() {
  const [from, setFrom] = useState(() => isoDaysAgo(29))
  const [to, setTo] = useState(() => todayIso())
  const [campus, setCampus] = useState('')
  const [appliedFrom, setAppliedFrom] = useState(from)
  const [appliedTo, setAppliedTo] = useState(to)
  const [appliedCampus, setAppliedCampus] = useState('')
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

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    setStatsError(null)
    try {
      setStats(await fetchEventsAdminStats(appliedFrom, appliedTo, appliedCampus || undefined))
    } catch (err) {
      setStatsError(err instanceof ApiError ? err.message : 'Не удалось загрузить статистику')
    } finally {
      setLoadingStats(false)
    }
  }, [appliedFrom, appliedTo, appliedCampus])

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    setUsersError(null)
    try {
      setUsers(
        await fetchEventsAdminUsers({
          page,
          size: PAGE_SIZE,
          campus: appliedCampus || undefined,
          role: role || undefined,
          q: appliedQ || undefined,
        }),
      )
    } catch (err) {
      setUsersError(err instanceof ApiError ? err.message : 'Не удалось загрузить пользователей')
    } finally {
      setLoadingUsers(false)
    }
  }, [page, appliedCampus, role, appliedQ])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const maxTotal = useMemo(() => {
    if (!stats?.series.length) return 1
    return Math.max(1, ...stats.series.map((d) => d.total))
  }, [stats])

  const applyRange = () => {
    setAppliedFrom(from)
    setAppliedTo(to || from)
    setAppliedCampus(campus)
    setAppliedQ(q)
    setPage(0)
  }

  return (
    <section className={styles.statsSection} aria-label="Статистика пользователей ЛК">
      <div className={styles.statsHead}>
        <div>
          <h2 className={styles.statsTitle}>Пользователи ЛК</h2>
          <p className={styles.statsHint}>
            Учёт с момента включения. Онлайн — активность за последние{' '}
            {stats?.onlineWindowMinutes ?? 15} мин. Филиал — контингент из 1С.
          </p>
        </div>
        <div className={styles.statsRange}>
          <label className={styles.label}>
            С
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className={styles.label}>
            По
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className={styles.label}>
            Филиал
            <select
              className={styles.input}
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
            >
              {CAMPUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={applyRange} disabled={loadingStats || loadingUsers}>
            Показать
          </Button>
        </div>
      </div>

      {loadingStats ? <Loader /> : null}
      {!loadingStats && statsError ? (
        <LoadError message={statsError} onRetry={() => void loadStats()} />
      ) : null}

      {!loadingStats && !statsError && stats ? (
        <>
          <div className={styles.statsCards}>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Всего в ЛК</span>
              <strong className={styles.statValue}>{stats.totalRegistered}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Онлайн сейчас</span>
              <strong className={styles.statValue}>{stats.onlineNow}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Новые за период</span>
              <strong className={styles.statValue}>{stats.newInRange}</strong>
            </article>
          </div>

          {stats.byCampus.length > 0 ? (
            <div className={styles.usersCard}>
              <h3 className={styles.chartTitle}>По филиалам</h3>
              <div className={styles.usersTableWrap}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>Филиал</th>
                      <th>Всего</th>
                      <th>Онлайн</th>
                      <th>Новые за период</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byCampus.map((row) => (
                      <tr key={row.campus}>
                        <td>{row.label}</td>
                        <td>{row.total}</td>
                        <td>{row.online}</td>
                        <td>{row.newInRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Новые пользователи по дням</h3>
            <div className={styles.chart}>
              {stats.series.map((day) => (
                <div key={day.date} className={styles.chartCol} title={`${day.date}: ${day.total}`}>
                  <div className={styles.chartBars}>
                    <div
                      className={styles.chartBarStudent}
                      style={{ height: `${(day.students / maxTotal) * 100}%` }}
                    />
                    <div
                      className={styles.chartBarParent}
                      style={{ height: `${(day.parents / maxTotal) * 100}%` }}
                    />
                  </div>
                  <span className={styles.chartDay}>{day.date.slice(8)}</span>
                </div>
              ))}
            </div>
            <div className={styles.chartLegend}>
              <span>
                <i className={styles.legendStudent} /> Студенты
              </span>
              <span>
                <i className={styles.legendParent} /> Родители
              </span>
            </div>
          </div>
        </>
      ) : null}

      <div className={styles.usersCard}>
        <div className={styles.statsHead}>
          <h3 className={styles.chartTitle}>
            Пользователи
            {users ? ` (${users.totalElements})` : ''}
          </h3>
          <div className={styles.statsRange}>
            <label className={styles.label}>
              Роль
              <select
                className={styles.input}
                value={role}
                onChange={(e) => {
                  setRole(e.target.value)
                  setPage(0)
                }}
              >
                <option value="">Все</option>
                <option value="STUDENT">Студент</option>
                <option value="PARENT">Родитель</option>
              </select>
            </label>
            <label className={styles.label}>
              Поиск
              <Input
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
            </label>
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
            {users.items.length === 0 ? (
              <p className={styles.statsHint}>Никого не найдено.</p>
            ) : (
              <div className={styles.usersTableWrap}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>Роль</th>
                      <th>ФИО</th>
                      <th>Зачетная книжка</th>
                      <th>Филиал</th>
                      <th>Первый вход</th>
                      <th>Был в сети</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.items.map((u) => (
                      <tr key={u.id}>
                        <td>{roleLabel(u.role)}</td>
                        <td>{u.displayName}</td>
                        <td>{u.studentId}</td>
                        <td>{u.campusLabel}</td>
                        <td>{formatInstant(u.firstLoginAt)}</td>
                        <td>{formatInstant(u.lastSeenAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {users.totalPages > 1 ? (
              <div className={styles.footerActions} style={{ justifyContent: 'space-between' }}>
                <Button
                  type="button"
                  disabled={page <= 0 || loadingUsers}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Назад
                </Button>
                <span className={styles.statsHint}>
                  Стр. {users.page + 1} из {users.totalPages}
                </span>
                <Button
                  type="button"
                  disabled={page + 1 >= users.totalPages || loadingUsers}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  )
}
