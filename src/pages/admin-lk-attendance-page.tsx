/**
 * @file Посещаемость по зачетной книжке в админ-панели ЛК.
 */

import { useCallback, useRef, useState } from 'react'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { fetchLkAdminAttendance, type AdminAttendanceDto } from '@/lk-admin'
import { Input } from '@/ui'
import styles from './admin-events.module.css'

function sourceLabel(source: string, branchCampus: boolean): string {
  if (source === 'zkbio') return 'ZKBio (Казань)'
  if (source === 'perco') return 'Perco (голова)'
  return branchCampus ? 'филиал' : 'голова'
}

export function AdminLkAttendancePage() {
  const studentIdRef = useRef('')
  const [draftStudentId, setDraftStudentId] = useState('')
  const [meta, setMeta] = useState<AdminAttendanceDto | null>(null)

  const fetchAttendance = useCallback(async (from: string, to: string) => {
    const data = await fetchLkAdminAttendance(studentIdRef.current, from, to)
    setMeta(data)
    return data
  }, [])

  const subtitle = meta
    ? [meta.fullName, meta.group, sourceLabel(meta.source, meta.branchCampus)]
        .filter((part) => part && part.trim())
        .join(' · ')
    : 'Проходы по расписанию для выбранной зачетной книжки'

  return (
    <section aria-label="Посещаемость по зачетной книжке">
      {meta ? (
        <p className={styles.attendanceMeta}>
          {meta.studentId}
          {meta.faculty ? ` · ${meta.faculty}` : ''}
          {meta.branch ? ` · ${meta.branch}` : ''}
        </p>
      ) : null}
      <AttendancePanel
        title="Посещаемость"
        subtitle={subtitle}
        fetchAttendance={fetchAttendance}
        extraFilters={
          <Input
            label="Номер зачетной книжки"
            name="studentId"
            autoComplete="off"
            placeholder="172194"
            inputMode="numeric"
            value={draftStudentId}
            onChange={(e) => setDraftStudentId(e.target.value)}
          />
        }
        onBeforeApply={() => {
          const id = draftStudentId.trim()
          if (!id) return 'Укажите номер зачетной книжки'
          studentIdRef.current = id
          setMeta(null)
          return null
        }}
        requestKey={() => draftStudentId.trim()}
      />
    </section>
  )
}
