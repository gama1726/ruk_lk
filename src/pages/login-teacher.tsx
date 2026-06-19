/**
 * @file Вход для преподавателя (mock SSO).
 */

import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Button } from '@/ui'
import form from './auth-form.module.css'
import pub from './public.module.css'

/**
 * Преподаватель входит через корпоративный портал — пока заглушка.
 */
export function TeacherLogin() {
  const goSso = () => {
    window.alert('Вход преподавателей будет через корпоративный портал РУК после подключения SSO.')
  }

  return (
    <>
      <AuthCard>
        <p className={card.sectionLabel}>Вход для преподавателя</p>
        <p className={form.hint}>
          Преподаватели и сотрудники входят через единый корпоративный портал. Студенческий логин здесь не
          подходит.
        </p>
        <Button type="button" fullWidth size="lg" onClick={goSso}>
          Войти через корпоративный портал
        </Button>
      </AuthCard>

      <p className={pub.back}>
        <Link to={paths.login}>Вход для студента</Link>
      </p>
    </>
  )
}
