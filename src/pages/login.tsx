/**
 * @file Страница входа студента — кнопка SSO, как на lk.mirea.ru/auth.php.
 */

import { useNavigate } from 'react-router-dom'
import { paths } from '@/paths'
import { redirectToSso } from '@/sso'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { LoginRoleLinks } from '@/blocks/login-role-links'
import { Button } from '@/ui'

/**
 * Главный экран входа: «Войти» → SSO или зачётка и код подтверждения.
 */
export function Login() {
  const navigate = useNavigate()

  const handleSso = () => {
    if (redirectToSso()) return
    navigate(paths.loginStudent)
  }

  return (
    <AuthCard>
      <p className={card.sectionLabel}>Вход для студента</p>

      <Button type="button" fullWidth size="lg" onClick={handleSso}>
        Войти
      </Button>

      <div className={card.divider}>
        <span>Или продолжить как</span>
      </div>
      <LoginRoleLinks />
    </AuthCard>
  )
}
