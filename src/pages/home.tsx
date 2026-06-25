import { useAuth } from '@/auth'
import { programLabel, firstName, courseLabel } from '@/mocks/format'
import { useCurrentProgram } from '@/study'
import { useStudentProfile } from '@/student-profile-store'
import { isApiConfigured } from '@/apiClient'
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
  const sessionName = useAuth((s) => s.session?.name)
  const profile = useStudentProfile((s) => s.profile)
  const name = firstName(sessionName ?? profile?.fullName ?? '')

  const subtitle = isApiConfigured() && profile
    ? `${profile.group} · Курс ${courseLabel(profile.course)} · ${profile.direction}`
    : programLabel(program)

  return (
    <>
      <ScreenHeader title={`Добрый день, ${name}`} subtitle={subtitle} />

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
