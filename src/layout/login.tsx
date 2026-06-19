import { Link, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/paths'
import styles from './login.module.css'

const nav = [
  { to: paths.resources, label: 'Ресурсы' },
  { to: paths.support, label: 'Поддержка' },
] as const

const authPaths: string[] = [
  paths.login,
  paths.loginParent,
  paths.loginContract,
  paths.loginTarget,
  paths.loginTeacher,
  paths.verify,
  paths.forgot,
]

/**
 * Оболочка публичных страниц: вход, ресурсы, поддержка.
 */
export function LoginShell() {
  const { pathname } = useLocation()
  const showBrand = authPaths.includes(pathname)

  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        <Link to={paths.login} className={styles.topBrand}>
          РУК
        </Link>
        <nav className={styles.topNav} aria-label="Публичное меню">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className={styles.topLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className={styles.main}>
        {showBrand ? (
          <div className={styles.brand}>
            <div className={styles.logo} aria-hidden="true">
              РУК
            </div>
            <p className={styles.org}>Российский университет кооперации</p>
          </div>
        ) : null}

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={styles.copy}>© {new Date().getFullYear()} Российский университет кооперации</p>
      </footer>
    </div>
  )
}
