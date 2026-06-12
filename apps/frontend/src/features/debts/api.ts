import { DebtData, DebtPaymentEventData, RecordDebtPaymentData } from '@carniceria/shared'
import { apiClient } from '@/lib/api-client'

export interface Debt extends Omit<DebtData, 'created_at' | 'updated_at'> {
  created_at: string
  updated_at: string | null
}

export interface DebtPaymentEvent extends Omit<DebtPaymentEventData, 'created_at'> {
  created_at: string
}

export interface DebtFilters {
  customer_id?: number
  status?: Debt['status']
  close_id?: number
}

export async function getDebts(filters?: DebtFilters): Promise<Debt[]> {
  const { data } = await apiClient.get<Debt[]>('/debts', { params: filters })
  return data
}

export async function getDebtPayments(debtId: number): Promise<DebtPaymentEvent[]> {
  const { data } = await apiClient.get<DebtPaymentEvent[]>(`/debts/${debtId}/payments`)
  return data
}

export async function recordDebtPayment(debtId: number, input: RecordDebtPaymentData): Promise<DebtPaymentEvent> {
  const { data } = await apiClient.post<DebtPaymentEvent>(`/debts/${debtId}/payments`, input)
  return data
}
