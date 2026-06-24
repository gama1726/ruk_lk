import { RouterProvider } from 'react-router-dom'
import { AuthBootstrap } from '@/layout/auth-bootstrap'
import { router } from './router'

export function App() {
  return (
    <AuthBootstrap>
      <RouterProvider router={router} />
    </AuthBootstrap>
  )
}
