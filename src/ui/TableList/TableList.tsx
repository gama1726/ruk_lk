import type { ReactNode } from 'react'
import { NoData } from '../NoData'
import { Loader } from '../Loader'
import { LoadError } from '../LoadError'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../Table'

type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
}

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  onRetry?: () => void
}

export function TableList<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyTitle = 'Нет данных',
  emptyDescription,
  onRetry,
}: Props<T>) {
  if (loading) return <Loader />
  if (error) return <LoadError message={error} onRetry={onRetry} />
  if (rows.length === 0) return <NoData title={emptyTitle} description={emptyDescription} />

  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableHeader key={col.key}>{col.header}</TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={rowKey(row)}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.render(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
