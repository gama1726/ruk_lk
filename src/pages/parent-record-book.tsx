import { useEffect } from 'react'
import { isApiConfigured } from '@/apiClient'
import { RecordBookPanel } from '@/blocks/record-book-panel'
import { ParentDataSection } from '@/layout/parent-locked-section'
import { useParentRecordBook } from '@/parent-record-book-store'

export function ParentRecordBook() {
  const rows = useParentRecordBook((s) => s.rows)
  const semesters = useParentRecordBook((s) => s.semesters)
  const meta = useParentRecordBook((s) => s.meta)
  const status = useParentRecordBook((s) => s.status)
  const error = useParentRecordBook((s) => s.error)
  const load = useParentRecordBook((s) => s.load)

  useEffect(() => {
    if (isApiConfigured() && status === 'idle') {
      void load()
    }
  }, [load, status])

  const loading = isApiConfigured() && (status === 'loading' || status === 'idle')

  return (
    <ParentDataSection title="Зачётная книжка ребёнка">
      <RecordBookPanel
        rows={rows}
        semesters={semesters}
        meta={meta}
        loading={loading}
        error={error}
        showBreadcrumb={false}
      />
    </ParentDataSection>
  )
}
