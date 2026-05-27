import { customerRepository } from '../../features/customers/customer.repository'
import { saleRepository } from '../../features/sales/sale.repository'
import { CustomerDTO } from '../../features/customers/models/customer.dto'
import { SaleDTO } from '../../features/sales/models/sale.dto'
import { Customer } from '../../features/customers/models/customer.model'
import { Sale } from '../../features/sales/models/sale.model'
import { DebtRepository } from '../../features/debts/debt.repository'
import { DebtDTO } from '../../features/debts/models/debt.dto'
import { Debt } from '../../features/debts/models/debt.model'
import { RecordDebtPayment } from '../../features/debts/models/recordDebtPayment.model'
import { Close } from '../../features/closes/models/close.model'
import { OpenClose } from '../../features/closes/models/openClose.model'
import { closeRepository } from '../../features/closes/close.repository'
import {FinishClose} from '../../features/closes/models/finishClose.model'
import { expenseRepository } from '../../features/expenses/expense.repository'
import { ExpenseDTO } from '../../features/expenses/models/expense.dto'
import { Expense } from '../../features/expenses/models/expense.model'
import { SaleDetailDTO } from '../../features/sale-details/models/sale-detail.dto'
import { SaleDetail } from '../../features/sale-details/models/sale-detail.model'
import { saleDetailRepository } from '../../features/sale-details/sale-detail.repository'
  

export async function createTestCustomer(overrides = {}): Promise<Customer > {
  const dto = new CustomerDTO({
    name: 'Juan',
    last_name: 'Pérez',
    phone: '1234567890',
    dni: '12345678',
    ...overrides
  })
  return customerRepository.create(dto)
}

export async function createTestSale(overrides = {}): Promise<Sale> {
  const dto = new SaleDTO({
    amount_meat: 1000,
    amount_merchandise: 500,
    pay_method: 'cc',
    ...overrides
  })
  return saleRepository.create(dto)
}

export async function createTestDebt(sales_id:number ,customer_id:number ,overrides = {}): Promise<Debt> {
  const dto = new DebtDTO({
    sales_id,
    customer_id,
    amount: 1500,
    ...overrides
  })
  return new DebtRepository().create(dto)
}

export function createRecordDebtPaymentData(
  paid_amount: number,
  pay_method: 'cash' | 'credit' | 'debit' | 'transfer' = 'cash'
): RecordDebtPayment {
  return new RecordDebtPayment({
    paid_amount,
    pay_method,
  })
}

export async function createTestClose() : Promise<Close> {
  const dto = new OpenClose({
    start_at: new Date().toISOString(),
  })
  return closeRepository.create(dto)
}

export async function finishTestClose(id: number,): Promise< Close | null> {
  const dto = new FinishClose({
    total_income:600,
    total_expense: 500,
    expected_cash: 100,
    end_at: new Date(),
  })
  return closeRepository.finish(id, dto)
}

export async function createTestExpense(amount: number): Promise<Expense> {
  const dto = new ExpenseDTO({
    category: 'Test',
    amount,
    description: 'Test expense'
  })
  return expenseRepository.create(dto)
}

export function createTestSaleDetailData(overrides = {}): SaleDetailDTO {
  const dto = new SaleDetailDTO({
    cut_name: 'Asado',
    price_per_kg: 10,
    weight_kg: 2,
    ...overrides
  })

  return dto
}

export async function createTestSaleDetails(sale_id: number, overridesList = [{}]): Promise<SaleDetail[]> {
  const details = overridesList.map((overrides) => createTestSaleDetailData(overrides))

  return saleDetailRepository.createMany(sale_id, details)
}
