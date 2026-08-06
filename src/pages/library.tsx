/**
 * @file Библиотека и электронные ресурсы.
 */

import { useEffect, useState } from 'react'
import { ApiError } from '@/apiClient'
import { formatLibraryDate, type LibraryBook } from '@/mocks/library'
import {
  booksFromDto,
  fetchStudentLibrary,
  isLibraryApiEnabled,
  libraryCardFromDto,
  mockStudentLibrary,
  type StudentLibraryDto,
} from '@/library'
import {
  ScreenHeader,
  NoData,
  StatusBadge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/ui'
import common from './service-common.module.css'
import styles from './library.module.css'

/**
 * Библиотека: читательский билет, книги на руках, задолженности.
 */
export function Library() {
  const apiEnabled = isLibraryApiEnabled()
  const [data, setData] = useState<StudentLibraryDto | null>(apiEnabled ? null : mockStudentLibrary())
  const [loading, setLoading] = useState(apiEnabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiEnabled) {
      setData(mockStudentLibrary())
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchStudentLibrary()
      .then((dto) => {
        if (!cancelled) {
          setData(dto)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof ApiError ? err.message : 'Не удалось загрузить данные библиотеки'
        setError(message)
        setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  const card = data ? libraryCardFromDto(data) : null
  const onHand: LibraryBook[] = data ? booksFromDto(data.onHand) : []
  const debts: LibraryBook[] = data ? booksFromDto(data.debts) : []
  const unavailable = data?.status === 'unavailable'
  const missing = data?.status === 'missing'

  return (
    <>
      <ScreenHeader title="Библиотека" subtitle="Читательский билет и книги на руках" />

      {loading && <p className={common.meta}>Загрузка…</p>}
      {error && <p className={common.meta}>{error}</p>}

      {!loading && !error && unavailable && (
        <p className={common.meta}>Данные библиотеки временно недоступны.</p>
      )}

      {!loading && !error && missing && (
        <p className={common.meta}>
          Читатель с номером зачётки {data?.studentId || '—'} в библиотеке не найден.
        </p>
      )}

      {!loading && !error && data && !unavailable && (
        <>
          <div className={common.grid}>
            <div className={common.card}>
              <h2 className={common.cardTitle}>Читательский билет</h2>
              <StatusBadge
                status={card?.status === 'active' ? 'active' : 'rejected'}
                label={card?.status === 'active' ? 'активен' : 'не найден'}
              />
              <p className={common.meta}>№ {card?.number}</p>
              {card?.holder && card.holder !== '—' ? (
                <p className={common.meta}>{card.holder}</p>
              ) : null}
            </div>
            <div className={common.card}>
              <h2 className={common.cardTitle}>Задолженности</h2>
              {debts.length === 0 ? (
                <p className={styles.noDebt}>Задолженностей по библиотеке нет</p>
              ) : (
                <ul className={styles.ebsList}>
                  {debts.map((b) => (
                    <li key={b.id} className={styles.ebsItem}>
                      <div>
                        <p className={styles.ebsName}>{b.title}</p>
                        <p className={common.meta}>{b.author}</p>
                        {b.dueDate ? (
                          <p className={common.meta}>Вернуть до {formatLibraryDate(b.dueDate)}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <section className={common.section}>
            <h2 className={common.sectionTitle}>Книги на руках</h2>
            {onHand.length === 0 ? (
              <NoData title="Нет книг на руках" />
            ) : (
              <>
                <div className={common.tableWrap}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Название</TableHeader>
                        <TableHeader>Автор</TableHeader>
                        <TableHeader>Выдана</TableHeader>
                        <TableHeader>Вернуть до</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {onHand.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>{b.title}</TableCell>
                          <TableCell>{b.author}</TableCell>
                          <TableCell>{b.takenAt ? formatLibraryDate(b.takenAt) : '—'}</TableCell>
                          <TableCell>{b.dueDate ? formatLibraryDate(b.dueDate) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className={common.cards}>
                  {onHand.map((b) => (
                    <article key={b.id} className={common.rowCard}>
                      <strong>{b.title}</strong>
                      <p className={common.meta}>{b.author}</p>
                      {b.dueDate ? (
                        <p className={common.meta}>Вернуть до {formatLibraryDate(b.dueDate)}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </>
  )
}
