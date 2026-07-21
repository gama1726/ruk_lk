/**
 * @file Библиотека и электронные ресурсы.
 * @see {@link libraryCard}
 */

import {
  booksOnHand,
  ebsResources,
  formatLibraryDate,
  libraryCard,
  libraryDebts,
  openEbsStub,
} from '@/mocks/library'
import {
  ScreenHeader,
  Button,
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
 * Библиотека: читательский билет, книги на руках, ЭБС.
 */
export function Library() {
  const card = libraryCard

  return (
    <>
      <ScreenHeader title="Библиотека / ЭБС (dev)" subtitle="Читательский билет и электронные ресурсы" />

      <div className={common.grid}>
        <div className={common.card}>
          <h2 className={common.cardTitle}>Читательский билет</h2>
          <StatusBadge status={card.status === 'active' ? 'active' : 'rejected'} label={card.status === 'active' ? 'активен' : 'заблокирован'} />
          <p className={common.meta}>№ {card.number}</p>
          <p className={common.meta}>{card.holder}</p>
          <p className={common.meta}>Действует до {formatLibraryDate(card.validUntil)}</p>
        </div>
        <div className={common.card}>
          <h2 className={common.cardTitle}>Задолженности</h2>
          {libraryDebts.length === 0 ? (
            <p className={styles.noDebt}>Задолженностей по библиотеке нет</p>
          ) : null}
        </div>
      </div>

      <section className={common.section}>
        <h2 className={common.sectionTitle}>Книги на руках</h2>
        {booksOnHand.length === 0 ? (
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
                  {booksOnHand.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.title}</TableCell>
                      <TableCell>{b.author}</TableCell>
                      <TableCell>{formatLibraryDate(b.takenAt)}</TableCell>
                      <TableCell>{formatLibraryDate(b.dueDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className={common.cards}>
              {booksOnHand.map((b) => (
                <article key={b.id} className={common.rowCard}>
                  <strong>{b.title}</strong>
                  <p className={common.meta}>{b.author}</p>
                  <p className={common.meta}>Вернуть до {formatLibraryDate(b.dueDate)}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className={common.section}>
        <h2 className={common.sectionTitle}>Электронные библиотечные системы</h2>
        <ul className={styles.ebsList}>
          {ebsResources.map((r) => (
            <li key={r.id} className={styles.ebsItem}>
              <div>
                <p className={styles.ebsName}>{r.name}</p>
                <p className={common.meta}>{r.description}</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => openEbsStub(r.name)}>
                Открыть
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
