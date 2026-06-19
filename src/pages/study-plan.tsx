import { programLabel } from '@/mocks/format'
import { planByProgram, planCreditsTotal } from '@/mocks/study-plan'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, NoData, Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/ui'
import styles from './study-plan.module.css'

/**
 * Учебный план: дисциплины по семестрам.
 */
export function StudyPlan() {
  const program = useCurrentProgram()
  const bySemester = planByProgram(program.id)
  const credits = planCreditsTotal(program.id)

  return (
    <>
      <ScreenHeader title="Учебный план" subtitle={programLabel(program)} />

      {bySemester.size === 0 ? (
        <NoData title="План не загружен" />
      ) : (
        <>
          <p className={styles.total}>Всего в плане: {credits} з.е.</p>

          {[...bySemester.entries()].map(([semester, rows]) => {
            const hours = rows.reduce((s, r) => s + r.hours, 0)
            const semCredits = rows.reduce((s, r) => s + r.credits, 0)

            return (
              <section key={semester} className={styles.semester}>
                <div className={styles.semesterHead}>
                  <h2 className={styles.semesterTitle}>{semester} семестр</h2>
                  <span className={styles.semesterMeta}>
                    {hours} ч. · {semCredits} з.е.
                  </span>
                </div>

                <div className={styles.tableWrap}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Дисциплина</TableHeader>
                        <TableHeader>Часы</TableHeader>
                        <TableHeader>З.е.</TableHeader>
                        <TableHeader>Форма контроля</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.subject}</TableCell>
                          <TableCell>{r.hours}</TableCell>
                          <TableCell>{r.credits}</TableCell>
                          <TableCell>{r.controlForm}</TableCell>
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
                        <span>{r.hours} ч.</span>
                        <span>{r.credits} з.е.</span>
                      </div>
                      <div className={styles.cardRow}>{r.controlForm}</div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </>
      )}
    </>
  )
}
