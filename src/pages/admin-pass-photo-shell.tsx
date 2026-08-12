/**
 * @file Админка пропусков — оболочка с шапкой РУК.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { educationTrackLabel, type EducationTrack } from '@/pass-photo'
import { paths } from '@/paths'
import { adminPassPhotoPageTitle, usePageTitle } from '@/use-page-title'
import styles from './admin-pass-photos.module.css'

type Props = {
  /** Если не задан — нейтральная шапка (страница входа) */
  track?: EducationTrack
  pageSection: string
  children: ReactNode
}

export function AdminPassPhotoShell({ track, pageSection, children }: Props) {
  usePageTitle(adminPassPhotoPageTitle(track, pageSection))

  return (
    <div className={styles.shell} data-track={track ?? 'ALL'}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link to={paths.adminPassPhotosLogin} className={styles.brand}>
            <img src={logo} alt="РУК" className={styles.logo} />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Фото для пропуска</span>
              <span className={styles.brandSub}>Администрирование</span>
            </div>
          </Link>
          <span className={styles.trackBadge}>
            {track ? educationTrackLabel[track] : 'СПО · ВО'}
          </span>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
