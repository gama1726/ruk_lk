import { useCallback } from 'react'
import { OrdersPanel } from '@/blocks/orders-panel'
import { ParentDataSection } from '@/layout/parent-locked-section'
import { fetchParentOrders } from '@/orders'
import { useParentAuth } from '@/parent-auth'

export function ParentOrders() {
  const session = useParentAuth((s) => s.session)
  const fetchOrders = useCallback(fetchParentOrders, [])

  const subtitle = session ? `Зачётка ${session.studentId}` : 'Приказы'

  return (
    <ParentDataSection title="Приказы">
      <OrdersPanel subtitle={subtitle} fetchOrders={fetchOrders} mockProgramId={session?.studentId} />
    </ParentDataSection>
  )
}
