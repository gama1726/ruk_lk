import { useCallback, useMemo } from 'react'
import { isApiConfigured } from '@/apiClient'
import { OrdersPanel } from '@/blocks/orders-panel'
import { programLabel } from '@/mocks/format'
import { fetchStudentOrders } from '@/orders'
import { useCurrentProgram } from '@/study'

export function Orders() {
  const program = useCurrentProgram()
  const fetchOrders = useCallback(fetchStudentOrders, [])

  const subtitle = useMemo(
    () => (isApiConfigured() ? 'Приказы' : `Демо · ${programLabel(program)}`),
    [program],
  )

  return (
    <OrdersPanel subtitle={subtitle} fetchOrders={fetchOrders} mockProgramId={program.id} />
  )
}
