import { createBrowserRouter, Navigate } from 'react-router-dom'
import { paths } from '@/paths'
import { LoginShell } from '@/layout/login'
import { SsoLayout } from '@/layout/sso'
import { CabinetShell } from '@/layout/cabinet'
import { GuestOnly } from '@/layout/guest-only'
import { RequireSession } from '@/layout/require-session'
import { Login } from '@/pages/login'
import { SsoLogin } from '@/pages/login-sso'
import { Verify } from '@/pages/verify-code'
import { ForgotPassword } from '@/pages/forgot-password'
import { ParentLogin } from '@/pages/login-parent'
import { ContractLogin } from '@/pages/login-contract'
import { TargetLogin } from '@/pages/login-target'
import { TeacherLogin } from '@/pages/login-teacher'
import { Resources } from '@/pages/resources'
import { Support } from '@/pages/support'
import { Home } from '@/pages/home'
import { Profile } from '@/pages/profile'
import { News } from '@/pages/news'
import { Schedule } from '@/pages/schedule'
import { Education } from '@/pages/education'
import { Grades } from '@/pages/grades'
import { RecordBook } from '@/pages/record-book'
import { Attendance } from '@/pages/attendance'
import { Debts } from '@/pages/debts'
import { StudyPlan } from '@/pages/study-plan'
import { Roadmap } from '@/pages/roadmap'
import { Teachers } from '@/pages/teachers'
import { Orders } from '@/pages/orders'
import { Services } from '@/pages/services'
import { Requests } from '@/pages/requests'
import { Payments } from '@/pages/payments'
import { Dormitory } from '@/pages/dormitory'
import { BypassList } from '@/pages/bypass-list'
import { Psychologist } from '@/pages/psychologist'
import { Portfolio } from '@/pages/portfolio'
import { Library } from '@/pages/library'
import { Settings } from '@/pages/settings'

export const router = createBrowserRouter([
  {
    element: <LoginShell />,
    children: [
      { path: paths.resources, element: <Resources /> },
      { path: paths.support, element: <Support /> },
      {
        element: <GuestOnly />,
        children: [
          { path: paths.login, element: <Login /> },
          { path: paths.loginParent, element: <ParentLogin /> },
          { path: paths.loginContract, element: <ContractLogin /> },
          { path: paths.loginTarget, element: <TargetLogin /> },
          { path: paths.loginTeacher, element: <TeacherLogin /> },
          { path: paths.verify, element: <Verify /> },
          { path: paths.forgot, element: <ForgotPassword /> },
        ],
      },
    ],
  },
  {
    element: <GuestOnly />,
    children: [
      {
        path: paths.sso,
        element: <SsoLayout />,
        children: [{ index: true, element: <SsoLogin /> }],
      },
    ],
  },
  {
    element: <RequireSession />,
    children: [
      {
        element: <CabinetShell />,
        children: [
          { path: paths.home, element: <Home /> },
          { path: paths.profile, element: <Profile /> },
          { path: paths.news, element: <News /> },
          { path: paths.schedule, element: <Schedule /> },
          { path: paths.education, element: <Education /> },
          { path: paths.grades, element: <Grades /> },
          { path: paths.recordBook, element: <RecordBook /> },
          { path: paths.attendance, element: <Attendance /> },
          { path: paths.debts, element: <Debts /> },
          { path: paths.studyPlan, element: <StudyPlan /> },
          { path: paths.roadmap, element: <Roadmap /> },
          { path: paths.teachers, element: <Teachers /> },
          { path: paths.orders, element: <Orders /> },
          { path: paths.services, element: <Services /> },
          { path: paths.requests, element: <Requests /> },
          { path: paths.payments, element: <Payments /> },
          { path: paths.dormitory, element: <Dormitory /> },
          { path: paths.bypassList, element: <BypassList /> },
          { path: paths.psychologist, element: <Psychologist /> },
          { path: paths.portfolio, element: <Portfolio /> },
          { path: paths.library, element: <Library /> },
          { path: paths.settings, element: <Settings /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.login} replace /> },
])
