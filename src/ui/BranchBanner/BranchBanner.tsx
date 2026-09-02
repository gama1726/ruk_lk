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

  const badgeClass = [
    styles.badge,
    variant === 'parent'
      ? styles.badgeParent
      : info.isMain
        ? styles.badgeStudentMain
        : styles.badgeStudentBranch,
  ].join(' ')

  return (
    <section
      className={[styles.banner, className].filter(Boolean).join(' ')}
      aria-label={`${eyebrow}: ${info.shortTitle}`}
    >
      <div className={styles.crestWrap}>
        <span className={styles.crestGlow} aria-hidden="true" />
        <Crest info={info} />
      </div>

      <div className={styles.body}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title}>{info.shortTitle}</h2>
        <p className={styles.subtitle}>{universityLegalName}</p>
      </div>

      <span className={badgeClass}>{badge}</span>
    </section>
  )
}
