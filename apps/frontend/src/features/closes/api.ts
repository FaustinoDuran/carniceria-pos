import { apiClient } from '@/lib/api-client'
import { Sale } from '@/features/sales/api'
import { Expense } from '@/features/expenses/api'
import { Debt, DebtPaymentEvent } from '@/features/debts/api'

export interface Close {
  id: number
  start_at: string
  end_at: string | null
  total_income: number
  total_expense: number
  expected_cash: number | null
  expected_card: number | null
  isOpen?: boolean
}

export interface CloseReconciliation {
  sideOne: { meat: number; merchandise: number; debtPaid: number; total: number }
  sideTwo: {
    cash: number | null
    card: number | null
    transfer: number
    debtGenerated: number
    expenses: number
    total: number | null
  }
  difference: number | null
  theoreticalCash: number
  theoreticalCard: number
  cashDifference: number | null
  cardDifference: number | null
  unexplainedDifference: number | null
}

export interface CloseReport {
  close: Close
  sales: {
    all: Sale[]
    byPayMethod: {
      cash: Sale[]
      transfer: Sale[]
      card: Sale[]
      cc: Sale[]
    }
  }
  debts: {
    generated: Debt[]
    paid: DebtPaymentEvent[]
  }
  expenses: Expense[]
  summary: {
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
    expectedCard: number | null
    debtPaidByMethod: { cash: number; card: number; transfer: number }
    reconciliation: CloseReconciliation
  }
}

export async function getActiveClose(): Promise<Close | null> {
  const { data } = await apiClient.get<Close | null>('/closes/active')
  return data
}

export interface CloseFilters {
  start_at?: string
  month?: string
  limit?: number
  offset?: number
}

export async function getCloses(filters?: CloseFilters): Promise<Close[]> {
  const { data } = await apiClient.get<Close[]>('/closes', { params: filters })
  return data
}

export async function startClose(): Promise<Close> {
  const { data } = await apiClient.post<Close>('/closes/start')
  return data
}

export async function finishClose(
  id: number,
  expected_cash?: number | null,
  expected_card?: number | null,
): Promise<Close> {
  const { data } = await apiClient.post<Close>(`/closes/${id}/finish`, {
    expected_cash: expected_cash ?? null,
    expected_card: expected_card ?? null,
  })
  return data
}

export async function getCloseReport(id: number): Promise<CloseReport> {
  const { data } = await apiClient.get<CloseReport>(`/closes/${id}/report`)
  return data
}

export async function downloadClosePdf(id: number): Promise<Blob> {
  const { data } = await apiClient.get(`/closes/${id}/report/pdf`, { responseType: 'blob' })
  return data
}
