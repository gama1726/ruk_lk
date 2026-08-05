/**
 * @file Психологическая поддержка — информация о приёме.
 */

import photo from '@/assets/psychologist.jpg'
import { psychologistInfo } from '@/data/psychologist'
import { ScreenHeader } from '@/ui'
import common from './service-common.module.css'
import styles from './psychologist.module.css'

/**
 * Приём психолога: контакты и темы консультаций (без онлайн-записи).
 */
export function Psychologist() {
  const info = psychologistInfo

  return (
    <>
      <ScreenHeader title="Психологическая поддержка" subtitle="Конфиденциальные консультации" />

      <div className={styles.info}>
        <img
          className={styles.photo}
          src={photo}
          alt="Групповая встреча с психологом РУК"
        />
        <div className={styles.infoBody}>
          <p className={styles.infoTitle}>{info.title}</p>
          <p className={common.meta}>Психолог: {info.specialist}</p>
          <p className={common.meta}>
            {info.location} · {info.locationHint}
          </p>
          <p className={common.meta}>{info.confidentiality}</p>
        </div>
      </div>

      <section className={common.section}>
        <h2 className={common.sectionTitle}>О чём можно поговорить</h2>
        <ul className={common.list}>
          {info.topics.map((topic) => (
            <li key={topic} className={common.item}>
              <p className={common.itemTitle}>{topic}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={common.section}>
        <h2 className={common.sectionTitle}>Как записаться</h2>
        <p className={common.meta}>
          Онлайн-запись пока недоступна. Приходите в {info.location.toLowerCase()} (
          {info.locationHint.toLowerCase()}).
        </p>
        <p className={styles.closing}>{info.closing}</p>
        <p className={styles.source}>
          <a className={styles.sourceLink} href={info.sourceUrl} target="_blank" rel="noopener noreferrer">
            {info.sourceLabel}
          </a>
        </p>
      </section>
    </>
  )
}
