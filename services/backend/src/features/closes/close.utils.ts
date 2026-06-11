import { NotFoundError, BusinessError } from '../../shared/errors'

export const roundMoney = (value: number): number => Number(value.toFixed(2))

export const saleTotal = (sale: { amount_meat: number; amount_merchandise: number }): number =>
  sale.amount_meat + sale.amount_merchandise

export const expenseTotal = (expense: { amount: number }): number => expense.amount

export const debtTotal = (debt: { amount: number }): number => debt.amount

export const paymentEventTotal = (event: { paid_amount: number }): number => event.paid_amount

// Validations for finishing a close: exists, is open, and is the active close
export async function validateFinishable(
  id: number,
  closeRepo: { getById: (id: number, client?: any) => Promise<any | null>; getActive: (client?: any) => Promise<any | null> },
  client?: any,
) {
  const close = await closeRepo.getById(id, client)
  if (!close) {
    throw new NotFoundError('Close not found')
  }

  if (!close.isOpen) {
    throw new BusinessError('Close is already finished')
  }

  const activeClose = await closeRepo.getActive(client)
  if (!activeClose || activeClose.id !== id) {
    throw new BusinessError('There is no active close to finish')
  }

  return close
}

export function calculateTotals(sales: Array<{ amount_meat: number; amount_merchandise: number }>, expenses: Array<{ amount: number }>) {
  const totalIncome = roundMoney(sales.reduce((total, sale) => total + saleTotal(sale), 0))
  const totalExpense = roundMoney(expenses.reduce((total, expense) => total + expenseTotal(expense), 0))
  return { totalIncome, totalExpense }
}
