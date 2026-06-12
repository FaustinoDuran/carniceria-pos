import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/providers/auth-provider'

export function Topbar() {
  const { authEnabled, signOut, userEmail } = useAuth()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      <div>
        <p className="text-sm font-medium text-slate-950">Panel operativo</p>
        <p className="text-xs text-slate-500">{userEmail || 'Backend conectado por API'}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          Carnicería Raúl
        </div>
        {authEnabled ? (
          <Button aria-label="Cerrar sesión" size="icon" variant="ghost" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </header>
  )
}
