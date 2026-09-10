/**
 * @file Статистика пользователей ЛК в админке мероприятий.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  fetchEventsAdminStats,
  type CabinetStats,
} from '@/events-admin'
import { Button, Input, Loader, LoadError } from '@/ui'
import styles from './admin-events.module.css'

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
  const [appliedFrom, setAppliedFrom] = useState(from)
  const [appliedTo, setAppliedTo] = useState(to)
  const [stats, setStats] = useState<CabinetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchEventsAdminStats(appliedFrom, appliedTo)
      setStats(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить статистику')
    } finally {
      setLoading(false)
    }
  }, [appliedFrom, appliedTo])

  useEffect(() => {
    void load()
  }, [load])

  const maxTotal = useMemo(() => {
    if (!stats?.series.length) return 1
    return Math.max(1, ...stats.series.map((d) => d.total))
  }, [stats])

  const applyRange = () => {
    setAppliedFrom(from)
    setAppliedTo(to || from)
  }

  return (
    <section className={styles.statsSection} aria-label="Статистика пользователей ЛК">
      <div className={styles.statsHead}>
        <div>
          <h2 className={styles.statsTitle}>Пользователи ЛК</h2>
          <p className={styles.statsHint}>
            Учёт с момента включения. Онлайн — активность за последние{' '}
            {stats?.onlineWindowMinutes ?? 15} мин.
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
          <Button type="button" onClick={applyRange} disabled={loading}>
            Показать
          </Button>
        </div>
      </div>

      {loading ? <Loader /> : null}
      {!loading && error ? <LoadError message={error} onRetry={() => void load()} /> : null}

      {!loading && !error && stats ? (
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

          <div className={styles.usersCard}>
            <h3 className={styles.chartTitle}>Последние регистрации (до 100)</h3>
            {stats.recentUsers.length === 0 ? (
              <p className={styles.statsHint}>Пока никто не входил после включения учёта.</p>
            ) : (
              <div className={styles.usersTableWrap}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>Роль</th>
                      <th>ФИО</th>
                      <th>Зачётка</th>
                      <th>Первый вход</th>
                      <th>Был в сети</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{roleLabel(u.role)}</td>
                        <td>{u.displayName}</td>
                        <td>{u.studentId}</td>
                        <td>{formatInstant(u.firstLoginAt)}</td>
                        <td>{formatInstant(u.lastSeenAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}
