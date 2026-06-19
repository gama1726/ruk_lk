/**
 * @file Вход для преподавателя (mock SSO).
 */

import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { ScreenHeader, Card, Button } from '@/ui'
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
      <ScreenHeader title="Вход для преподавателя" />

      <Card>
        <p className={form.hint}>
          Преподаватели и сотрудники входят через единый корпоративный портал. Студенческий логин здесь не
          подходит.
        </p>
        <Button type="button" fullWidth onClick={goSso}>
          Войти через корпоративный портал
        </Button>
      </Card>

      <p className={pub.back}>
        <Link to={paths.login}>Вход для студента</Link>
      </p>
    </>
  )
}
