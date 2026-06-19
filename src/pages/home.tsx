import { student } from '@/mocks/student'
import { programLabel, firstName } from '@/mocks/format'
import { useCurrentProgram } from '@/study'
import { ScreenHeader } from '@/ui'
import { StudentStrip } from '@/blocks/student-strip'
import { NextLesson } from '@/blocks/next-lesson'
import { TodayLessons } from '@/blocks/today-lessons'
import { DebtAlert } from '@/blocks/debt-alert'
import { PaymentAlert } from '@/blocks/payment-alert'
import { NoticesFeed } from '@/blocks/notices-feed'
import { WarningsList } from '@/blocks/warnings-list'
import { QuickLinks } from '@/blocks/quick-links'
import styles from '@/blocks/home.module.css'

/**
 * Главная страница кабинета со сводкой на день.
 * Данные зависят от {@link useCurrentProgram}.
 */
export function Home() {
  const program = useCurrentProgram()
  const name = firstName(student.fullName)

  return (
    <>
      <ScreenHeader title={`Добрый день, ${name}`} subtitle={programLabel(program)} />

      <div className={styles.grid}>
        <StudentStrip />
        <NextLesson />
        <PaymentAlert />
        <TodayLessons />
        <NoticesFeed />
        <DebtAlert />
        <WarningsList />
        <QuickLinks />
      </div>
    </>
  )
}
