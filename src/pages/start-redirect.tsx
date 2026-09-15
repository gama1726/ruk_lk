/**
 * @file Переход в start.ruc.su через серверный мост ЛК.
 */

import { useEffect } from 'react'
import { getApiBaseUrl } from '@/apiClient'
import { clearLoginReturn } from '@/login-return'
import { Card, ScreenHeader } from '@/ui'

export function StartRedirect() {
  useEffect(() => {
    clearLoginReturn()
    window.location.replace(`${getApiBaseUrl()}/api/student/start/redirect`)
  }, [])

  return (
    <>
      <ScreenHeader title="Start" subtitle="Переход в образовательную платформу" />
      <Card padding="lg">
        <p>Открываем start.ruc.su…</p>
      </Card>
    </>
  )
}
