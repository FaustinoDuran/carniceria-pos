import { customerRepository } from '../../features/customers/customer.repository'
import { saleRepository } from '../../features/sales/sale.repository'
import { CustomerDTO } from '../../features/customers/models/customer.dto'
import { SaleDTO } from '../../features/sales/models/sale.dto'
import { Customer } from '../../features/customers/models/customer.model'
import { Sale } from '../../features/sales/models/sale.model'
import { DebtRepository } from '../../features/debts/debt.repository'
import { DebtDTO } from '../../features/debts/models/debt.dto'
import { Debt } from '../../features/debts/models/debt.model'
import { UpdateDebt } from '../../features/debts/models/updateDebt.model'
import { Close } from '../../features/closes/models/close.model'
import { OpenClose } from '../../features/closes/models/openClose.model'
import { closeRepository } from '../../features/closes/close.repository'
  

export async function createTestCustomer(overrides = {}): Promise<Customer> {
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

export async function createUpdateDebtData(amount: number, status: Debt['status']): Promise<UpdateDebt> {
  const dto = new UpdateDebt({
    amount,
    status
  })
  return dto
}

export async function createCloseTestData(sales_id : number[], expenses_id : number[]) : Promise<Close> {
  const dto = new OpenClose({
    start_at: new Date().toISOString(),
    sales_id,
    expenses_id
  })
  return closeRepository.create(dto)
}

