/**
 * @file Электронная зачётная книжка (оценки, БРС, сводка по семестрам).
 */

import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { isApiConfigured } from '@/apiClient'
import { RecordBookPanel } from '@/blocks/record-book-panel'
import { useRecordBook } from '@/record-book-store'
import { paths } from '@/paths'
import { useCurrentProgram } from '@/study'

export function RecordBook() {
  const program = useCurrentProgram()
  const rows = useRecordBook((s) => s.rows)
  const semesters = useRecordBook((s) => s.semesters)
  const meta = useRecordBook((s) => s.meta)
  const bookStatus = useRecordBook((s) => s.status)
  const loadRecordBook = useRecordBook((s) => s.load)

  useEffect(() => {
    if (isApiConfigured() && bookStatus === 'idle') {
      void loadRecordBook(program.id)
    }
  }, [bookStatus, loadRecordBook, program.id])

  const loading = isApiConfigured() && (bookStatus === 'loading' || bookStatus === 'idle')

  return (
    <RecordBookPanel
      rows={rows}
      semesters={semesters}
      meta={meta}
      loading={loading}
      showBreadcrumb
    />
  )
}

/** Старый маршрут `/grades` → зачётная книжка. */
export function GradesRedirect() {
  return <Navigate to={paths.recordBook} replace />
}
