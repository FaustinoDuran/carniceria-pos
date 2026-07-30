import { Close } from './models/close.model'
import { Sale } from '../sales/models/sale.model'
import { Expense } from '../expenses/models/expense.model'
import { DebtData, DebtPaymentEventData } from '@carniceria/shared'
import { CloseReconciliation } from './close.utils'

export interface CloseReportGeneratedDebt extends DebtData {
  customer_name: string
}

export interface CloseReportPaidDebt extends DebtPaymentEventData {
  customer_id: number
  customer_name: string
}

export interface SalesByPayMethod {
  cash: Sale[]
  transfer: Sale[]
  card: Sale[]
  cc: Sale[]
}

export interface CloseSummary {
  totalMeat: number
  totalMerchandise: number
  totalSales: number
  totalCash: number
  totalTransfer: number
  totalCard: number
  totalDebtGenerated: number
  totalDebtPaid: number
  totalExpenses: number
  realIncome: number
  // Montos declarados por el cajero al cerrar: efectivo contado y cierre de posnet.
  expectedCash: number | null
  expectedCard: number | null
  debtPaidByMethod: { cash: number; card: number; transfer: number }
  reconciliation: CloseReconciliation
}

export interface CloseReportData {
  close: Close
  sales: {
    all: Sale[]
    byPayMethod: SalesByPayMethod
  }
  debts: {
    generated: CloseReportGeneratedDebt[]
    paid: CloseReportPaidDebt[]
  }
  expenses: Expense[]
  summary: CloseSummary
}
