import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { LoadingState } from '@/components/common/loading-state'
import { useAuth } from '@/app/providers/auth-provider'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-sm">
          <LoadingState />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
