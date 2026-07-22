import { useEffect, useState } from 'react'
import { ApiError, isApiConfigured } from '@/apiClient'
import { programLabel } from '@/mocks/format'
import { formatOrderDate, ordersByProgram } from '@/mocks/orders'
import { fetchStudentOrders, isOrdersApiEnabled, type StudentOrderItemDto } from '@/orders'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, NoData, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/ui'
import styles from './orders.module.css'

type Row = {
  id: string
  title: string
  number: string
  orderDate: string
  displayOrderDate: string
  startDate: string
  displayStartDate: string
  document: string
}

function mapApiOrders(items: StudentOrderItemDto[]): Row[] {
  return items.map((o) => ({
    id: o.id,
    title: o.title || o.type,
    number: o.number,
    orderDate: o.orderDate,
    displayOrderDate: o.displayOrderDate || (o.orderDate ? formatOrderDate(o.orderDate) : '—'),
    startDate: o.startDate,
    displayStartDate: o.displayStartDate || (o.startDate ? formatOrderDate(o.startDate) : '—'),
    document: o.document,
  }))
}

function mapMockOrders(programId: string): Row[] {
  return ordersByProgram(programId).map((o) => ({
    id: o.id,
    title: o.type,
    number: o.number,
    orderDate: o.date,
    displayOrderDate: formatOrderDate(o.date),
    startDate: '',
    displayStartDate: '—',
    document: o.fileName,
  }))
}

/**
 * Приказы студента из 1С (или мок без API).
 */
export function Orders() {
  const program = useCurrentProgram()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(isOrdersApiEnabled())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOrdersApiEnabled()) {
      setRows(mapMockOrders(program.id))
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const data = await fetchStudentOrders()
        if (!cancelled) {
          setRows(mapApiOrders(data.orders))
        }
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setError(e instanceof ApiError ? e.message : 'Не удалось загрузить приказы')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [program.id])

  const subtitle = isApiConfigured()
    ? 'Приказы из учебной системы'
    : `Демо · ${programLabel(program)}`

  return (
    <>
      <ScreenHeader title="Приказы" subtitle={subtitle} />

      {loading && <p>Загрузка…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && rows.length === 0 ? (
        <NoData title="Приказов нет" />
      ) : !loading && rows.length > 0 ? (
        <>
          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Приказ</TableHeader>
                  <TableHeader>Номер</TableHeader>
                  <TableHeader>Дата приказа</TableHeader>
                  <TableHeader>Действует с</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className={styles.titleCell}>
                        <strong>{o.title}</strong>
                        {o.document && <span className={styles.docHint}>{o.document}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{o.number || '—'}</TableCell>
                    <TableCell>{o.displayOrderDate || '—'}</TableCell>
                    <TableCell>{o.displayStartDate || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={styles.cards}>
            {rows.map((o) => (
              <article key={o.id} className={styles.card}>
                <strong>{o.title}</strong>
                {o.document && <p className={styles.docHint}>{o.document}</p>}
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Номер</span>
                  <span>{o.number || '—'}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Дата приказа</span>
                  <span>{o.displayOrderDate || '—'}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Действует с</span>
                  <span>{o.displayStartDate || '—'}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}
