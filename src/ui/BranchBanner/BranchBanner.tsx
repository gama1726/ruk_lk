import type { Branch } from '@/branch-display'
import styles from './BranchBanner.module.css'

export type BranchBannerProps = {
  branch: Branch
  viewerType: 'student' | 'parent'
  className?: string
}

const viewerLabel = {
  student: 'Ваш филиал',
  parent: 'Филиал обучения студента',
} as const

export function BranchBanner({ branch, viewerType, className }: BranchBannerProps) {
  const badgeText = branch.badge ?? 'Текущий филиал'

  return (
    <section className={[styles.banner, className].filter(Boolean).join(' ')} aria-label="Информация о филиале">
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <div className={styles.lightEffects} aria-hidden="true" />

      <div className={styles.emblem}>
        <img
          className={styles.emblemImg}
          src={branch.emblem}
          alt={`${branch.name} — герб`}
          decoding="async"
          draggable={false}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.label}>{viewerLabel[viewerType]}</div>
        <h2 className={styles.title}>{branch.name}</h2>
        <div className={styles.university}>{branch.universityName}</div>
      </div>

      {badgeText ? (
        <div className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden="true" />
          {badgeText}
        </div>
      ) : null}
    </section>
  )
}
