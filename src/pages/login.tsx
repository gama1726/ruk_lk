import { ScreenHeader, Card, Input, Button } from '@/ui'
import styles from './auth-form.module.css'

export function Login() {
  return (
    <>
      <ScreenHeader title="Вход" />
      <Card>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <Input
            label="Почта или логин"
            type="email"
            name="login"
            autoComplete="username"
            placeholder="ivanov.as@student.ruc.local"
          />
          <Input label="Пароль" type="password" name="password" autoComplete="current-password" />
          <p className={styles.hint}>Для входа нужна корпоративная почта студента РУК.</p>
          <div className={styles.actions}>
            <Button type="submit" fullWidth>
              Войти
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
