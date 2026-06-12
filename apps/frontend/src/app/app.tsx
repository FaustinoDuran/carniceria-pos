import { Toaster } from 'sonner'
import { AuthProvider } from './providers/auth-provider'
import { QueryProvider } from './providers/query-provider'
import { RouterProvider } from './providers/router-provider'

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RouterProvider />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryProvider>
  )
}
