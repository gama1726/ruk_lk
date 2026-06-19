import { ScreenHeader, Card, Input, Button } from '@/ui'
import styles from './auth-form.module.css'

export function Verify() {
  return (
    <>
      <ScreenHeader title="Код из письма" subtitle="Подтвердите вход" />
      <Card>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <p className={styles.hint}>
            Отправили шестизначный код на <strong>i***v.as@student.ruc.local</strong>. Проверьте входящие и папку
            «Спам».
          </p>
          <Input
            label="Код"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className={styles.code}
          />
          <div className={styles.actions}>
            <Button type="submit" fullWidth>
              Подтвердить
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
