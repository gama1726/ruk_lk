/**
 * @file Вход для преподавателя — тот же SSO, что у студента (как в МИРЭА).
 */

import { Navigate } from 'react-router-dom'
import { paths } from '@/paths'

/** Редирект на общий SSO-провайдер. */
export function TeacherLogin() {
  return <Navigate to={paths.sso} replace />
}
