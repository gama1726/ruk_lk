/**
 * @file Переход в кабинет киберспорта через backend-мост.
 */

import { useEffect, useState } from 'react'
import { ScreenHeader } from '@/ui'
import { getApiBaseUrl, isApiConfigured } from '@/apiClient'

export function EsportsRedirect() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured()) {
      setError('API личного кабинета не подключено.')
      return
    }
    window.location.assign(`${getApiBaseUrl()}/api/student/esports/redirect`)
  }, [])

  return (
    <>
      <ScreenHeader
        title="Киберспорт"
        subtitle="Открываем кабинет капитана на сайте киберспорта РУК"
      />
      <p>{error ?? 'Переходим…'}</p>
    </>
  )
}
