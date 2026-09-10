/**
 * @file Live-нагрузка API и исходящих сервисов в админке.
 */

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  fetchEventsAdminLoad,
  resetEventsAdminLoad,
  type ApiLoadEndpoint,
  type ApiLoadSnapshot,
  type OutboundError,
} from '@/events-admin'
import { Button, Loader, LoadError } from '@/ui'
import styles from './admin-events.module.css'

const POLL_MS = 3000

function formatTime(atMs: number): string {
  try {
    return new Date(atMs).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return String(atMs)
  }
}

function LoadTable({
  rows,
  serviceColumn,
}: {
  rows: ApiLoadEndpoint[]
  serviceColumn: boolean
}) {
  if (rows.length === 0) {
    return <p className={styles.statsHint}>Пока нет запросов.</p>
  }

  return (
    <div className={styles.usersTableWrap}>
      <table className={styles.usersTable}>
        <thead>
          <tr>
            <th>{serviceColumn ? 'Сервис' : 'Method'}</th>
            <th>{serviceColumn ? 'Операция' : 'Path'}</th>
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
          {rows.map((row) => (
            <tr
              key={`${row.method} ${row.path}`}
              className={row.inFlight > 0 ? styles.loadRowActive : undefined}
            >
              <td>{row.method}</td>
              <td className={styles.loadPath}>{row.path}</td>
              <td>{row.inFlight}</td>
              <td>{row.requestsPerMinute}</td>
              <td>
                {row.minInFlightAllTime} / {row.avgInFlightAllTime} / {row.maxInFlightAllTime}
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
  )
}

function RecentErrors({ rows, emptyHint }: { rows: OutboundError[]; emptyHint: string }) {
  if (rows.length === 0) {
    return <p className={styles.statsHint}>{emptyHint}</p>
  }

  return (
    <div className={styles.usersTableWrap}>
      <table className={styles.usersTable}>
        <thead>
          <tr>
            <th>Время</th>
            <th>Сервис</th>
            <th>Операция</th>
            <th>HTTP</th>
            <th>Деталь</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.atMs}-${row.service}-${row.operation}-${idx}`}>
              <td>{formatTime(row.atMs)}</td>
              <td>{row.service}</td>
              <td className={styles.loadPath}>{row.operation}</td>
              <td>{row.status}</td>
              <td className={styles.loadPath}>{row.detail || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminEventsLoad() {
  const [load, setLoad] = useState<ApiLoadSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

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

  const onReset = async () => {
    if (!window.confirm('Сбросить накопительную статистику нагрузки (API + исходящие)?')) {
      return
    }
    setResetting(true)
    try {
      const data = await resetEventsAdminLoad()
      setLoad(data)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сбросить метрики')
    } finally {
      setResetting(false)
    }
  }

  const uptimeMin =
    load == null
      ? 0
      : Math.max(0, Math.floor((load.collectedAtMs - load.processStartedAtMs) / 60_000))

  const outbound = load?.outbound ?? []
  const outboundInFlight = load?.outboundInFlight ?? 0
  const outboundRpm = load?.outboundRequestsPerMinute ?? 0
  const recentOutbound = load?.recentOutboundErrors ?? []
  const recentApi = load?.recentApiErrors ?? []

  return (
    <section className={styles.statsSection} aria-label="Нагрузка API">
      <div className={styles.statsHead}>
        <div>
          <h2 className={styles.statsTitle}>Нагрузка API</h2>
          <p className={styles.statsHint}>
            Свежие ошибки — в лентах ниже (до 40). Lifetime-цифры в таблицах копятся в БД. Обновление
            каждые {POLL_MS / 1000} с.
            {load ? ` Аптайм процесса ≈ ${uptimeMin} мин.` : ''}
          </p>
        </div>
        <Button type="button" variant="secondary" loading={resetting} onClick={() => void onReset()}>
          Сбросить статистику
        </Button>
      </div>

      {loading && !load ? <Loader /> : null}
      {error && !load ? <LoadError message={error} onRetry={() => void refresh()} /> : null}

      {load ? (
        <>
          <div className={styles.statsCards}>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>API in-flight</span>
              <strong className={styles.statValue}>{load.totalInFlight}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>API RPM</span>
              <strong className={styles.statValue}>{load.totalRequestsPerMinute}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Исходящие in-flight</span>
              <strong className={styles.statValue}>{outboundInFlight}</strong>
            </article>
            <article className={styles.statCard}>
              <span className={styles.statLabel}>Исходящие RPM</span>
              <strong className={styles.statValue}>{outboundRpm}</strong>
            </article>
          </div>

          <div className={styles.usersCard}>
            <h3 className={styles.chartTitle}>Свежие ошибки API</h3>
            <p className={styles.statsHint}>
              Последние 4xx/5xx входящих запросов (в памяти). Смотрите `POST /api/auth/send-code`.
            </p>
            <RecentErrors rows={recentApi} emptyHint="Свежих ошибок API нет." />
          </div>

          <div className={styles.usersCard}>
            <h3 className={styles.chartTitle}>Свежие ошибки исходящих</h3>
            <p className={styles.statsHint}>
              Unisender / MAX / 1С и др. — кто именно падает сейчас.
            </p>
            <RecentErrors rows={recentOutbound} emptyHint="Свежих ошибок исходящих нет." />
          </div>

          <div className={styles.usersCard}>
            <h3 className={styles.chartTitle}>Исходящие сервисы</h3>
            <LoadTable rows={outbound} serviceColumn />
          </div>

          <div className={styles.usersCard}>
            <h3 className={styles.chartTitle}>Входящие endpoint’ы ЛК</h3>
            <LoadTable rows={load.endpoints} serviceColumn={false} />
            {error ? <p className={styles.error}>{error}</p> : null}
          </div>
        </>
      ) : null}
    </section>
  )
}
