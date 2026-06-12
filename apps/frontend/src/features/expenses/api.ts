import { CreateExpensesData, ExpensesData, UpdateExpensesData } from '@carniceria/shared'
import { apiClient } from '@/lib/api-client'

export interface Expense extends Omit<ExpensesData, 'created_at'> {
  created_at: string
}

export interface ExpenseFilters {
  close_id?: number | 'null'
  date?: string
}

export async function getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
  const { data } = await apiClient.get<Expense[]>('/expenses', { params: filters })
  return data
}

export async function createExpense(input: CreateExpensesData): Promise<Expense> {
  const { data } = await apiClient.post<Expense>('/expenses', input)
  return data
}

export async function updateExpense(id: number, input: UpdateExpensesData): Promise<Expense> {
  const { data } = await apiClient.put<Expense>(`/expenses/${id}`, input)
  return data
}

export async function deleteExpense(id: number): Promise<void> {
  await apiClient.delete(`/expenses/${id}`)
}
