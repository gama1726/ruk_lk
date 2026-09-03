import { createBrowserRouter, Navigate } from 'react-router-dom'
import { paths } from '@/paths'
import { LoginShell } from '@/layout/login'
import { SsoLayout } from '@/layout/sso'
import { CabinetShell } from '@/layout/cabinet'
import { GuestOnly } from '@/layout/guest-only'
import { RequireSession } from '@/layout/require-session'
import { Login } from '@/pages/login'
import { StudentLogin } from '@/pages/login-student'
import { LoginDelivery } from '@/pages/login-delivery'
import { SsoLogin } from '@/pages/login-sso'
import { Verify } from '@/pages/verify-code'
import { ParentLogin } from '@/pages/login-parent'
import { ParentLoginSelect } from '@/pages/login-parent-select'
import { ParentLoginDelivery } from '@/pages/login-parent-delivery'
import { ParentLoginVerify } from '@/pages/login-parent-verify'
import { ParentCabinetShell } from '@/layout/parent-cabinet'
import { RequireParentSession } from '@/layout/require-parent-session'
import { ParentGuestOnly } from '@/layout/parent-guest-only'
import { ParentSurvey } from '@/pages/parent-survey'
import { ParentContacts } from '@/pages/parent-contacts'
import { ParentProfile } from '@/pages/parent-profile'
import { ParentSchedule } from '@/pages/parent-schedule'
import { ParentRecordBook } from '@/pages/parent-record-book'
import { ParentAttendance } from '@/pages/parent-attendance'
import { ParentOrders } from '@/pages/parent-orders'
import { ParentPayments } from '@/pages/parent-payments'
import { ContractLogin } from '@/pages/login-contract'
import { TargetLogin } from '@/pages/login-target'
import { TeacherLogin } from '@/pages/login-teacher'
import { Resources } from '@/pages/resources'
import { Support } from '@/pages/support'
import { Profile } from '@/pages/profile'
import { News } from '@/pages/news'
import { Schedule } from '@/pages/schedule'
import { Education } from '@/pages/education'
import { RecordBook, GradesRedirect } from '@/pages/record-book'
import { Attendance } from '@/pages/attendance'
import { EJournal } from '@/pages/e-journal'
import { Debts } from '@/pages/debts'
import { StudyPlan } from '@/pages/study-plan'
import { Roadmap } from '@/pages/roadmap'
import { Teachers } from '@/pages/teachers'
import { Orders } from '@/pages/orders'
import { Services } from '@/pages/services'
import { Requests } from '@/pages/requests'
import { Payments } from '@/pages/payments'
import { Psychologist } from '@/pages/psychologist'
import { Portfolio } from '@/pages/portfolio'
import { Library } from '@/pages/library'
import { Settings } from '@/pages/settings'
import { PassPhoto } from '@/pages/pass-photo'
import { EsportsRedirect } from '@/pages/esports-redirect'
import { AdminPassPhotosHe, AdminPassPhotosSpo } from '@/pages/admin-pass-photos'
import { AdminPassPhotoLogin } from '@/pages/admin-pass-photo-login'
import { AdminEventsLogin } from '@/pages/admin-events-login'
import { AdminEventsPage } from '@/pages/admin-events'
import { EventsPage } from '@/pages/events'
import { ParentEvents } from '@/pages/parent-events'

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
          { path: paths.loginStudent, element: <StudentLogin /> },
          { path: paths.loginDelivery, element: <LoginDelivery /> },
          { path: paths.loginParent, element: <ParentLogin /> },
          {
            element: <ParentGuestOnly />,
            children: [
              { path: paths.loginParentSelect, element: <ParentLoginSelect /> },
              { path: paths.loginParentDelivery, element: <ParentLoginDelivery /> },
              { path: paths.loginParentVerify, element: <ParentLoginVerify /> },
            ],
          },
          { path: paths.loginContract, element: <ContractLogin /> },
          { path: paths.loginTarget, element: <TargetLogin /> },
          { path: paths.loginTeacher, element: <TeacherLogin /> },
          { path: paths.verify, element: <Verify /> },
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
          { path: paths.home, element: <Navigate to={paths.profile} replace /> },
          { path: paths.profile, element: <Profile /> },
          { path: paths.news, element: <News /> },
          { path: paths.events, element: <EventsPage /> },
          { path: paths.schedule, element: <Schedule /> },
          { path: paths.education, element: <Education /> },
          { path: paths.grades, element: <GradesRedirect /> },
          { path: paths.recordBook, element: <RecordBook /> },
          { path: paths.attendance, element: <Attendance /> },
          { path: paths.eJournal, element: <EJournal /> },
          { path: paths.debts, element: <Debts /> },
          { path: paths.studyPlan, element: <StudyPlan /> },
          { path: paths.roadmap, element: <Roadmap /> },
          { path: paths.teachers, element: <Teachers /> },
          { path: paths.orders, element: <Orders /> },
          { path: paths.services, element: <Services /> },
          { path: paths.requests, element: <Requests /> },
          { path: paths.payments, element: <Payments /> },
          { path: paths.psychologist, element: <Psychologist /> },
          { path: paths.portfolio, element: <Portfolio /> },
          { path: paths.library, element: <Library /> },
          { path: paths.settings, element: <Settings /> },
          { path: paths.passPhoto, element: <PassPhoto /> },
          { path: paths.esports, element: <EsportsRedirect /> },
        ],
      },
    ],
  },
  {
    element: <RequireParentSession />,
    children: [
      {
        element: <ParentCabinetShell />,
        children: [
          { path: paths.parentHome, element: <ParentProfile /> },
          { path: paths.parentProfile, element: <Navigate to={paths.parentHome} replace /> },
          { path: paths.parentSurvey, element: <ParentSurvey /> },
          { path: paths.parentEvents, element: <ParentEvents /> },
          { path: paths.parentContacts, element: <ParentContacts /> },
          { path: paths.parentSchedule, element: <ParentSchedule /> },
          { path: paths.parentRecordBook, element: <ParentRecordBook /> },
          { path: paths.parentAttendance, element: <ParentAttendance /> },
          { path: paths.parentOrders, element: <ParentOrders /> },
          { path: paths.parentPayments, element: <ParentPayments /> },
        ],
      },
    ],
  },
  { path: paths.adminPassPhotos, element: <Navigate to={paths.adminPassPhotosLogin} replace /> },
  { path: paths.adminPassPhotosLogin, element: <AdminPassPhotoLogin /> },
  { path: paths.adminPassPhotosSpoLogin, element: <Navigate to={paths.adminPassPhotosLogin} replace /> },
  { path: paths.adminPassPhotosHeLogin, element: <Navigate to={paths.adminPassPhotosLogin} replace /> },
  { path: paths.adminPassPhotosSpo, element: <AdminPassPhotosSpo /> },
  { path: paths.adminPassPhotosHe, element: <AdminPassPhotosHe /> },
  { path: paths.adminEventsLogin, element: <AdminEventsLogin /> },
  { path: paths.adminEvents, element: <AdminEventsPage /> },
  { path: '*', element: <Navigate to={paths.login} replace /> },
])
