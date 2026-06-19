import { Link, Outlet, useLocation } from 'react-router-dom'
import { publicNav, socialLinks } from '@/mocks/public-nav'
import { paths } from '@/paths'
import styles from './login.module.css'

const widePaths: string[] = [paths.resources, paths.support]

/**
 * Оболочка публичных страниц: вход, ресурсы, поддержка.
 */
export function LoginShell() {
  const { pathname } = useLocation()
  const wide = widePaths.includes(pathname)

  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        <nav className={styles.topNav} aria-label="Публичное меню">
          {publicNav.map((item) => (
            <Link key={item.label} to={item.to} className={styles.topLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className={styles.main}>
        <div className={wide ? styles.contentWide : styles.content}>
          <Outlet />
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.social}>
          {socialLinks.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
              {s.label.slice(0, 2)}
            </a>
          ))}
        </div>
        <p className={styles.copy}>© {new Date().getFullYear()} Российский университет кооперации</p>
      </footer>
    </div>
  )
}
