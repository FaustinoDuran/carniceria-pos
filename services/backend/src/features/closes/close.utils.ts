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

// Reparte los cobros de cuenta corriente segun como entro la plata.
// Importa para el cuadre: un cobro en efectivo va a la caja, uno con tarjeta al posnet.
export function splitDebtPaidByMethod(payments: Array<{ paid_amount: number; pay_method: string }>) {
  const sumWhere = (methods: string[]) =>
    roundMoney(payments.filter((p) => methods.includes(p.pay_method)).reduce((total, p) => total + paymentEventTotal(p), 0))

  return {
    cash: sumWhere(['cash']),
    card: sumWhere(['credit', 'debit']),
    transfer: sumWhere(['transfer']),
  }
}

export interface ReconciliationInput {
  totalMeat: number
  totalMerchandise: number
  totalCash: number
  totalTransfer: number
  totalCard: number
  totalDebtGenerated: number
  totalDebtPaid: number
  totalExpenses: number
  debtPaidByMethod: { cash: number; card: number; transfer: number }
  declaredCash: number | null
  declaredCard: number | null
}

export interface CloseReconciliation {
  // Lado 1: lo que se vendio y se cobro.
  sideOne: { meat: number; merchandise: number; debtPaid: number; total: number }
  // Lado 2: donde esta ese dinero. cash y card son declarados por el cajero.
  sideTwo: { cash: number | null; card: number | null; transfer: number; debtGenerated: number; expenses: number; total: number | null }
  // Lado 2 - Lado 1. Debe dar 0. null si falta algun monto declarado.
  difference: number | null
  // Lo que deberia haber segun el sistema, contra lo declarado.
  theoreticalCash: number
  theoreticalCard: number
  cashDifference: number | null
  cardDifference: number | null
  // La diferencia total tiene que descomponerse exacto en los dos arqueos.
  // Si sobra algo, hay una inconsistencia en los datos (p.ej. venta en cta cte sin deuda asociada).
  unexplainedDifference: number | null
}

// Cuadre de cierre de caja (Forma A: dos lados que deben coincidir).
//
//   Lado 1 = carne + vineria + recibido cta cte
//   Lado 2 = efectivo contado + posnet declarado + M.P + boletas cta cte + gastos pagados
//   diferencia = Lado 2 - Lado 1  ->  debe dar 0
//
// El termino M.P suma las ventas por transferencia y tambien los cobros de deuda por
// transferencia; si no, un cobro asi rompe el cuadre sin que haya un error real.
export function buildReconciliation(input: ReconciliationInput): CloseReconciliation {
  const sideOneTotal = roundMoney(input.totalMeat + input.totalMerchandise + input.totalDebtPaid)

  const transfer = roundMoney(input.totalTransfer + input.debtPaidByMethod.transfer)
  const hasDeclared = input.declaredCash !== null && input.declaredCard !== null
  const sideTwoTotal = hasDeclared
    ? roundMoney((input.declaredCash ?? 0) + (input.declaredCard ?? 0) + transfer + input.totalDebtGenerated + input.totalExpenses)
    : null

  const theoreticalCash = roundMoney(input.totalCash + input.debtPaidByMethod.cash - input.totalExpenses)
  const theoreticalCard = roundMoney(input.totalCard + input.debtPaidByMethod.card)

  const cashDifference = input.declaredCash === null ? null : roundMoney(input.declaredCash - theoreticalCash)
  const cardDifference = input.declaredCard === null ? null : roundMoney(input.declaredCard - theoreticalCard)
  const difference = sideTwoTotal === null ? null : roundMoney(sideTwoTotal - sideOneTotal)

  const unexplainedDifference =
    difference === null || cashDifference === null || cardDifference === null
      ? null
      : roundMoney(difference - cashDifference - cardDifference)

  return {
    sideOne: {
      meat: input.totalMeat,
      merchandise: input.totalMerchandise,
      debtPaid: input.totalDebtPaid,
      total: sideOneTotal,
    },
    sideTwo: {
      cash: input.declaredCash,
      card: input.declaredCard,
      transfer,
      debtGenerated: input.totalDebtGenerated,
      expenses: input.totalExpenses,
      total: sideTwoTotal,
    },
    difference,
    theoreticalCash,
    theoreticalCard,
    cashDifference,
    cardDifference,
    unexplainedDifference,
  }
}
