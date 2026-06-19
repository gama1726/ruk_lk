import { programLabel } from '@/mocks/format'
import {
  brsByProgram,
  courseworkByProgram,
  formatGradeDate,
  gradesByProgram,
  practiceByProgram,
} from '@/mocks/record-book'
import { gradeStatusLabel } from '@/mocks/record-book-types'
import { useCurrentProgram } from '@/study'
import {
  ScreenHeader,
  Tabs,
  NoData,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  StatusBadge,
} from '@/ui'
import styles from './record-book.module.css'

/**
 * Таблица оценок по семестрам.
 * @param programId - id программы
 */
function GradesTab({ programId }: { programId: string }) {
  const bySemester = gradesByProgram(programId)

  if (bySemester.size === 0) {
    return <NoData title="Записей пока нет" />
  }

  return (
    <>
      {[...bySemester.entries()].map(([semester, rows]) => (
        <section key={semester} className={styles.semester}>
          <h3 className={styles.semesterTitle}>{semester} семестр</h3>

          <div className={styles.tableWrap}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Дисциплина</TableHeader>
                  <TableHeader>Форма</TableHeader>
                  <TableHeader>Оценка</TableHeader>
                  <TableHeader>Баллы</TableHeader>
                  <TableHeader>Преподаватель</TableHeader>
                  <TableHeader>Дата</TableHeader>
                  <TableHeader>Статус</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>{r.controlForm}</TableCell>
                    <TableCell>{r.grade ?? '—'}</TableCell>
                    <TableCell>{r.points ?? '—'}</TableCell>
                    <TableCell>{r.teacher}</TableCell>
                    <TableCell>{formatGradeDate(r.date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} label={gradeStatusLabel[r.status]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={styles.cards}>
            {rows.map((r) => (
              <article key={r.id} className={styles.card}>
                <strong>{r.subject}</strong>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Оценка</span>
                  <span>{r.grade ?? '—'}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>Преподаватель</span>
                  <span>{r.teacher}</span>
                </div>
                <StatusBadge status={r.status} label={gradeStatusLabel[r.status]} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

function BrsTab({ programId }: { programId: string }) {
  const rows = brsByProgram(programId)
  if (rows.length === 0) return <NoData title="Нет данных БРС" />

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Дисциплина</TableHeader>
          <TableHeader>Семестр</TableHeader>
          <TableHeader>Баллы</TableHeader>
          <TableHeader>Преподаватель</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.subject}</TableCell>
            <TableCell>{r.semester}</TableCell>
            <TableCell>
              {r.points} / {r.maxPoints}
            </TableCell>
            <TableCell>{r.teacher}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PracticeTab({ programId }: { programId: string }) {
  const rows = practiceByProgram(programId)
  if (rows.length === 0) return <NoData title="Практики нет в записи" />

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Вид</TableHeader>
          <TableHeader>Место</TableHeader>
          <TableHeader>Период</TableHeader>
          <TableHeader>Руководитель</TableHeader>
          <TableHeader>Оценка</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.title}</TableCell>
            <TableCell>{r.place}</TableCell>
            <TableCell>{r.period}</TableCell>
            <TableCell>{r.supervisor}</TableCell>
            <TableCell>
              <StatusBadge status={r.status} label={gradeStatusLabel[r.status]} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function CourseworkTab({ programId }: { programId: string }) {
  const rows = courseworkByProgram(programId)
  if (rows.length === 0) return <NoData title="Курсовых работ нет" />

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Дисциплина</TableHeader>
          <TableHeader>Тема</TableHeader>
          <TableHeader>Руководитель</TableHeader>
          <TableHeader>Защита</TableHeader>
          <TableHeader>Оценка</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.subject}</TableCell>
            <TableCell>{r.topic}</TableCell>
            <TableCell>{r.supervisor}</TableCell>
            <TableCell>{formatGradeDate(r.defendedAt)}</TableCell>
            <TableCell>
              <StatusBadge status={r.status} label={gradeStatusLabel[r.status]} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/**
 * Зачётная книжка с вкладками БРС, практика и курсовые.
 */
export function RecordBook() {
  const program = useCurrentProgram()

  return (
    <>
      <ScreenHeader title="Зачётная книжка" subtitle={programLabel(program)} />

      <Tabs
        items={[
          { id: 'grades', label: 'Зачётная книжка', content: <GradesTab programId={program.id} /> },
          { id: 'brs', label: 'БРС', content: <BrsTab programId={program.id} /> },
          { id: 'practice', label: 'Практика', content: <PracticeTab programId={program.id} /> },
          { id: 'coursework', label: 'Курсовые', content: <CourseworkTab programId={program.id} /> },
        ]}
      />
    </>
  )
}
