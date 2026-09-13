/**
 * @file Посещаемость по зачётке в админке ЛК.
 */

import { useCallback, useRef, useState } from 'react'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { fetchAdminAttendance, type AdminAttendanceDto } from '@/events-admin'
import { Input } from '@/ui'
import styles from './admin-events.module.css'

function sourceLabel(source: string, branchCampus: boolean): string {
  if (source === 'zkbio') return 'ZKBio (филиал)'
  if (source === 'perco') return 'Perco (голова)'
  return branchCampus ? 'филиал' : 'голова'
}

export function AdminEventsAttendancePage() {
  const studentIdRef = useRef('')
  const [draftStudentId, setDraftStudentId] = useState('')
  const [meta, setMeta] = useState<AdminAttendanceDto | null>(null)

  const fetchAttendance = useCallback(async (from: string, to: string) => {
    const data = await fetchAdminAttendance(studentIdRef.current, from, to)
    setMeta(data)
    return data
  }, [])

  const subtitle = meta
    ? [meta.fullName, meta.group, sourceLabel(meta.source, meta.branchCampus)]
        .filter((part) => part && part.trim())
        .join(' · ')
    : 'Проходы по расписанию для выбранной зачётки'

  return (
    <section aria-label="Посещаемость по зачётке">
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
            label="Номер зачётки"
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
          if (!id) return 'Укажите номер зачётки'
          studentIdRef.current = id
          setMeta(null)
          return null
        }}
      />
    </section>
  )
}
