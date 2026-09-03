import { useState } from 'react'
import {
  getBranchDisplayInfo,
  universityLegalName,
  type BranchDisplayInfo,
} from '@/branch-display'
import styles from './BranchBanner.module.css'

export type BranchBannerVariant = 'student' | 'parent'

type BranchBannerProps = {
  branchLabel?: string | null
  variant: BranchBannerVariant
  className?: string
}

function Crest({ info }: { info: BranchDisplayInfo }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className={styles.crestFallback} aria-hidden="true">
        {info.crestInitials}
      </span>
    )
  }

  return (
    <img
      src={info.crestSrc}
      alt=""
      className={styles.crestImage}
      style={{
        objectPosition: info.crestPosition,
        transform: `scale(${info.crestScale})`,
      }}
      onError={() => setFailed(true)}
      decoding="async"
      draggable={false}
    />
  )
}

export function BranchBanner({ branchLabel, variant, className }: BranchBannerProps) {
  const info = getBranchDisplayInfo(branchLabel)
  const eyebrow = variant === 'parent' ? 'Филиал обучения студента' : 'Ваш филиал'
  const badge = variant === 'parent' ? info.parentBadge : info.studentBadge

  return (
    <section
      className={[styles.banner, className].filter(Boolean).join(' ')}
      aria-label={`${eyebrow}: ${info.shortTitle}`}
    >
      <div className={styles.crestWrap} aria-hidden="true">
        <span className={styles.crestAura} />
        <span className={styles.crestHalo} />
        <div className={styles.crestCircle}>
          <Crest info={info} />
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title}>{info.shortTitle}</h2>
        <p className={styles.subtitle}>{universityLegalName}</p>
      </div>

      <span className={styles.badge}>{badge}</span>
    </section>
  )
}
