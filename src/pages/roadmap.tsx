import { programLabel } from '@/mocks/format'
import { currentSemester, roadmapByProgram, roadmapStatusLabel } from '@/mocks/roadmap'
import type { RoadmapStatus } from '@/mocks/roadmap'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, NoData } from '@/ui'
import styles from './roadmap.module.css'

const chipClass: Record<RoadmapStatus, string> = {
  done: styles.chipDone,
  now: styles.chipNow,
  ahead: styles.chipAhead,
  risk: styles.chipRisk,
}

const dotClass: Record<RoadmapStatus, string> = {
  done: styles.done,
  now: styles.now,
  ahead: styles.ahead,
  risk: styles.risk,
}

/**
 * Траектория обучения — дорожная карта по семестрам.
 */
export function Roadmap() {
  const program = useCurrentProgram()
  const track = roadmapByProgram(program.id)
  const semNow = currentSemester(program.id, program.course)

  return (
    <>
      <ScreenHeader title="Траектория" subtitle={programLabel(program)} />

      {track.size === 0 ? (
        <NoData title="Траектория не построена" />
      ) : (
        <>
          <div className={styles.legend} aria-label="Легенда">
            {(Object.keys(roadmapStatusLabel) as RoadmapStatus[]).map((key) => (
              <span key={key} className={styles.legendItem}>
                <span className={[styles.dot, dotClass[key]].join(' ')} aria-hidden="true" />
                {roadmapStatusLabel[key]}
              </span>
            ))}
          </div>

          <div className={styles.track}>
            {[...track.entries()].map(([semester, items]) => {
              const isCurrent = semester === semNow
              return (
                <section
                  key={semester}
                  className={[styles.semesterBlock, isCurrent ? styles.semesterBlockCurrent : ''].filter(Boolean).join(' ')}
                >
                  <h2 className={[styles.semesterLabel, isCurrent ? styles.semesterLabelCurrent : ''].filter(Boolean).join(' ')}>
                    {semester} семестр
                    {isCurrent ? ' · вы здесь' : ''}
                  </h2>
                  <div className={styles.chips}>
                    {items.map((item) => (
                      <div key={item.id} className={[styles.chip, chipClass[item.status]].join(' ')}>
                        {item.subject}
                        {item.note ? <span className={styles.chipNote}>{item.note}</span> : null}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
