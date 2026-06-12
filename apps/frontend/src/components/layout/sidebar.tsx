import { CreditCard, History, LockKeyhole, ReceiptText, ShoppingCart, Users, WalletCards } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const items = [
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/ventas/historial', label: 'Historial', icon: History },
  { to: '/gastos', label: 'Gastos', icon: ReceiptText },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/cuentas-corrientes', label: 'Cuentas corrientes', icon: CreditCard },
  { to: '/cierres', label: 'Cierre de caja', icon: LockKeyhole },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-700 text-white">
          <WalletCards className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">Carnicería Raúl</p>
          <p className="text-xs text-slate-500">Punto de venta</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
              isActive ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
