import { Close } from './models/close.model'
import { Sale } from '../sales/models/sale.model'
import { Expense } from '../expenses/models/expense.model'
import { Debt } from '../debts/models/debt.model'
import { DebtPaymentEvent } from '../debts/models/debtPaymentEvent.model'

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
  expectedCash: number | null
}

export interface CloseReportData {
  close: Close
  sales: {
    all: Sale[]
    byPayMethod: SalesByPayMethod
  }
  debts: {
    generated: Debt[]
    paid: DebtPaymentEvent[]
  }
  expenses: Expense[]
  summary: CloseSummary
}