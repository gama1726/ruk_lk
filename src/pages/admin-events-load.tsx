/**
 * @file Live-нагрузка API в админке мероприятий.
 */

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/apiClient'
import { fetchEventsAdminLoad, type ApiLoadSnapshot } from '@/events-admin'
import { Loader, LoadError } from '@/ui'
import styles from './admin-events.module.css'

const POLL_MS = 3000

export function AdminEventsLoad() {
  const [load, setLoad] = useState<ApiLoadSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchEventsAdminLoad()
      setLoad(data)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить нагрузку')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  const uptimeMin =
    load == null
      ? 0
      : Math.max(0, Math.floor((load.collectedAtMs - load.processStartedAtMs) / 60_000))

  return (
    <section className={styles.statsSection} aria-label="Нагрузка API">
      <div className={styles.statsHead}>
        <div>
          <h2 className={styles.statsTitle}>Нагрузка API</h2>
          <p className={styles.statsHint}>
            Сейчас: in-flight и RPM (~{load?.windowSeconds ?? 60} с). За всё время: min / avg / max
            одновременных запросов и RPM — пишутся в БД, переживают рестарт. Обновление каждые{' '}
            {POLL_MS / 1000} с.
            {load ? ` Аптайм процесса ≈ ${uptimeMin} мин.` : ''}
          </p>
        </div>
      </div>

      {loading && !load ? <Loader /> : null}
      {error && !load ? <LoadError message={error} onRetry={() => void refresh()} /> : null}

      {load ? (
        <>
          <div className={styles.statsCards}>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Сейчас in-flight</span>
              <strong className={styles.statValue}>{load.totalInFlight}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Всего RPM</span>
              <strong className={styles.statValue}>{load.totalRequestsPerMinute}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Endpoint’ов</span>
              <strong className={styles.statValue}>{load.endpoints.length}</strong>
            </article>
          </div>

          <div className={styles.usersCard}>
            <h3 className={styles.chartTitle}>По endpoint’ам</h3>
            {load.endpoints.length === 0 ? (
              <p className={styles.statsHint}>Пока нет запросов к API.</p>
            ) : (
              <div className={styles.usersTableWrap}>
                <table className={styles.usersTable}>
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Path</th>
                      <th>Now</th>
                      <th>RPM</th>
                      <th>In-flight min/avg/max</th>
                      <th>RPM min/avg/max</th>
                      <th>ms min/avg/max</th>
                      <th>4xx</th>
                      <th>5xx</th>
                      <th>Всего</th>
                    </tr>
                  </thead>
                  <tbody>
                    {load.endpoints.map((row) => (
                      <tr
                        key={`${row.method} ${row.path}`}
                        className={row.inFlight > 0 ? styles.loadRowActive : undefined}
                      >
                        <td>{row.method}</td>
                        <td className={styles.loadPath}>{row.path}</td>
                        <td>{row.inFlight}</td>
                        <td>{row.requestsPerMinute}</td>
                        <td>
                          {row.minInFlightAllTime} / {row.avgInFlightAllTime} /{' '}
                          {row.maxInFlightAllTime}
                        </td>
                        <td>
                          {row.minRpmAllTime} / {row.avgRpmAllTime} / {row.maxRpmAllTime}
                        </td>
                        <td>
                          {row.minDurationMs} / {row.avgDurationMs} / {row.maxDurationMs}
                        </td>
                        <td>{row.errors4xx}</td>
                        <td>{row.errors5xx}</td>
                        <td>{row.completedTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {error ? <p className={styles.error}>{error}</p> : null}
          </div>
        </>
      ) : null}
    </section>
  )
}
