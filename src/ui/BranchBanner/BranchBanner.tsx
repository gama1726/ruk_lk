import styles from './BranchBanner.module.css'

export type BranchBannerProps = {
  label?: string
  title?: string
  subtitle?: string
  badge?: string
  emblemSrc?: string
  className?: string
}

export function BranchBanner({
  label = 'Ваш филиал',
  title = 'Головной вуз — Мытищи',
  subtitle = 'Российский университет кооперации',
  badge = 'Текущий филиал',
  emblemSrc,
  className,
}: BranchBannerProps) {
  return (
    <section
      className={[styles.banner, className].filter(Boolean).join(' ')}
      aria-label={`${label}: ${title}`}
    >
      <div className={[styles.glow, styles.glowLeft].join(' ')} aria-hidden="true" />
      <div className={[styles.glow, styles.glowRight].join(' ')} aria-hidden="true" />

      <div className={styles.emblemWrap}>
        <div className={styles.emblemGlow} aria-hidden="true" />
        {emblemSrc ? (
          <img
            className={styles.emblem}
            src={emblemSrc}
            alt=""
            aria-hidden="true"
            decoding="async"
            draggable={false}
          />
        ) : null}
      </div>

      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>

      {badge ? <div className={styles.badge}>{badge}</div> : null}
    </section>
  )
}
