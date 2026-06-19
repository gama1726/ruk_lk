import { student } from '@/mocks/student'
import { programLabel, firstName } from '@/mocks/format'
import { useCurrentProgram } from '@/study'
import { ScreenHeader, NoData } from '@/ui'

/**
 * Главная страница после входа.
 * Пока без виджетов — заголовок уже завязан на {@link useCurrentProgram}.
 */
export function Home() {
  const program = useCurrentProgram()
  const name = firstName(student.fullName)

  return (
    <>
      <ScreenHeader title={`Добрый день, ${name}`} subtitle={programLabel(program)} />
      <NoData title="Пока нет данных" />
    </>
  )
}
