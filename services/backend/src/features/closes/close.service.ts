import { CloseFilters, FinishCloseInput, ICloseService } from './close.service.interface'
import { Close } from './models/close.model'
import { OpenClose } from './models/openClose.model'
import { FinishClose } from './models/finishClose.model'
import { CloseReportData } from './types'
import { closeRepository } from './close.repository'
import { saleRepository } from '../sales/sale.repository'
import { expenseRepository } from '../expenses/expense.repository'
import { debtRepository } from '../debts/debt.repository'
import { BusinessError, NotFoundError } from '../../shared/errors'
import { withTransaction } from '../../shared/transaction.helper'
import { roundMoney, saleTotal, expenseTotal, debtTotal, paymentEventTotal, validateFinishable, calculateTotals } from './close.utils'

export class CloseService implements ICloseService {
  
    async start(): Promise<Close> {
    const activeClose = await closeRepository.getActive()
    if (activeClose) {
      throw new BusinessError('There is already an active close')
    }

    return closeRepository.create(new OpenClose({ start_at: new Date() }))
  }

  async finish(id: number, input?: FinishCloseInput): Promise<Close> {
    return withTransaction(async (client) => {
      const close = await validateFinishable(id, closeRepository, client)

      const sales = await saleRepository.getAll({ close_id: null }, client)
      const expenses = await expenseRepository.getAll({ close_id: null }, client)

      if (sales.length === 0 && expenses.length === 0) {
        throw new BusinessError('Close must have sales or expenses registered')
      }

      const { totalIncome, totalExpense } = calculateTotals(sales, expenses)

      const saleIds = sales.map((sale) => sale.id)
      const expenseIds = expenses.map((expense) => expense.id)

      if (saleIds.length > 0) {
        await saleRepository.setClosed(id, saleIds, client)
      }

      if (expenseIds.length > 0) {
        await expenseRepository.setClosed(id, expenseIds, client)
      }

      const finishedClose = await closeRepository.finish(
        id,
        new FinishClose({
          end_at: new Date(),
          total_income: totalIncome,
          total_expense: totalExpense,
          expected_cash: input?.expected_cash ?? null,
        }),
        client,
      )

      if (!finishedClose) {
        throw new BusinessError('Close could not be finished')
      }

      return finishedClose
    })
  }

  async search(filters?: CloseFilters): Promise<Close[]> {
    const closes = await closeRepository.getAll(filters)
    if (filters && closes.length === 0) {
      throw new NotFoundError('Closes not found')
    }
    return closes
  }

  async getById(id: number): Promise<Close> {
    const close = await closeRepository.getById(id)
    if (!close) {
      throw new NotFoundError('Close not found')
    }
    return close
  }

  async getActive(): Promise<Close | null> {
    return closeRepository.getActive()
  }

  async getReportData(id: number): Promise<CloseReportData> {
    const close = await closeRepository.getById(id)
    if (!close) {
      throw new NotFoundError('Close not found')
    }

    if (close.isOpen) {
      throw new BusinessError('Close report can only be generated for finished closes')
    }

    const sales = await saleRepository.getAll({ close_id: id })
    const expenses = await expenseRepository.getAll({ close_id: id })
    const generatedDebts = await debtRepository.getGeneratedForCloseReport(id)
    const paidDebts = await debtRepository.getPaidForCloseReport(id)

    const cashSales = sales.filter((sale) => sale.pay_method === 'cash')
    const transferSales = sales.filter((sale) => sale.pay_method === 'transfer')
    const cardSales = sales.filter((sale) => sale.pay_method === 'credit' || sale.pay_method === 'debit')
    const ccSales = sales.filter((sale) => sale.pay_method === 'cc')

    const totalMeat = roundMoney(sales.reduce((total, sale) => total + sale.amount_meat, 0))
    const totalMerchandise = roundMoney(sales.reduce((total, sale) => total + sale.amount_merchandise, 0))
    const totalSales = roundMoney(sales.reduce((total, sale) => total + saleTotal(sale), 0))
    const totalCash = roundMoney(cashSales.reduce((total, sale) => total + saleTotal(sale), 0))
    const totalTransfer = roundMoney(transferSales.reduce((total, sale) => total + saleTotal(sale), 0))
    const totalCard = roundMoney(cardSales.reduce((total, sale) => total + saleTotal(sale), 0))
    const totalDebtGenerated = roundMoney(generatedDebts.reduce((total, debt) => total + debtTotal(debt), 0))
    const totalDebtPaid = roundMoney(paidDebts.reduce((total, event) => total + paymentEventTotal(event), 0))
    const totalExpenses = roundMoney(expenses.reduce((total, expense) => total + expenseTotal(expense), 0))
    const realIncome = roundMoney(totalCash + totalTransfer + totalCard + totalDebtPaid - totalExpenses)

    return {
      close,
      sales: {
        all: sales,
        byPayMethod: {
          cash: cashSales,
          transfer: transferSales,
          card: cardSales,
          cc: ccSales,
        },
      },
      debts: {
        generated: generatedDebts,
        paid: paidDebts,
      },
      expenses,
      summary: {
        totalMeat,
        totalMerchandise,
        totalSales,
        totalCash,
        totalTransfer,
        totalCard,
        totalDebtGenerated,
        totalDebtPaid,
        totalExpenses,
        realIncome,
        expectedCash: close.expected_cash,
      },
    }
  }
}

export const closeService = new CloseService()
