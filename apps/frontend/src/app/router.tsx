import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { RegisterSalePage } from '@/features/sales/pages/register-sale-page'
import { SalesHistoryPage } from '@/features/sales/pages/sales-history-page'
import { ExpensesPage } from '@/features/expenses/pages/expenses-page'
import { CustomersPage } from '@/features/customers/pages/customers-page'
import { DebtsPage } from '@/features/debts/pages/debts-page'
import { ClosesPage } from '@/features/closes/pages/closes-page'
import { CloseDetailPage } from '@/features/closes/pages/close-detail-page'
import { LoginPage } from '@/features/auth/login-page'
import { ProtectedRoute } from '@/features/auth/protected-route'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/ventas" replace /> },
      { path: 'ventas', element: <RegisterSalePage /> },
      { path: 'ventas/historial', element: <SalesHistoryPage /> },
      { path: 'gastos', element: <ExpensesPage /> },
      { path: 'clientes', element: <CustomersPage /> },
      { path: 'cuentas-corrientes', element: <DebtsPage /> },
      { path: 'cierres', element: <ClosesPage /> },
      { path: 'cierres/:id', element: <CloseDetailPage /> },
    ],
  },
])
