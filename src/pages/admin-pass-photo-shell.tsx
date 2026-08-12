/**
 * @file Админка пропусков — оболочка с шапкой РУК.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { educationTrackLabel, type EducationTrack } from '@/pass-photo'
import { paths } from '@/paths'
import styles from './admin-pass-photos.module.css'

type Props = {
  track: EducationTrack
  children: ReactNode
}

export function AdminPassPhotoShell({ track, children }: Props) {
  const otherLogin =
    track === 'SPO' ? paths.adminPassPhotosHeLogin : paths.adminPassPhotosSpoLogin

  return (
    <div className={styles.shell} data-track={track}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link to={otherLogin} className={styles.brand}>
            <img src={logo} alt="РУК" className={styles.logo} />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Фото для пропуска</span>
              <span className={styles.brandSub}>Администрирование</span>
            </div>
          </Link>
          <span className={styles.trackBadge}>{educationTrackLabel[track]}</span>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
