/**
 * @file Вход для преподавателя — пока недоступен.
 */

import { Navigate } from 'react-router-dom'
import { paths } from '@/paths'

/** Редирект на экран «Скоро» кабинета преподавателя. */
export function TeacherLogin() {
  return <Navigate to={paths.sso} replace />
}
