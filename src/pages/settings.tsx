import { useAuth } from '@/auth'
import { ScreenHeader, NoData, Button } from '@/ui'

export function Settings() {
  const signOut = useAuth((s) => s.signOut)

  return (
    <>
      <ScreenHeader
        title="Настройки"
        actions={
          <Button variant="ghost" onClick={signOut}>
            Выйти
          </Button>
        }
      />
      <NoData title="Пока нет данных" />
    </>
  )
}
