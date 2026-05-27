import { Customer } from '../../features/customers/models/customer.model';
import { CustomerDTO } from '../../features/customers/models/customer.dto';
import { Debt } from '../../features/debts/models/debt.model';
import { DebtDTO } from '../../features/debts/models/debt.dto';
import { DebtPaymentEvent } from '../../features/debts/models/debtPaymentEvent.model';
import { RecordDebtPayment } from '../../features/debts/models/recordDebtPayment.model';
import { DebtData, DebtPaymentEventData, RecordDebtPaymentData } from '@carniceria/shared';

export const mockCustomer : Customer = new Customer({
  id: 1,
  name: 'Juan',
  last_name: 'Pérez',
  phone: '1234567890',
  dni: '12345678',
  deleted_at: null,
  created_at: new Date()
})

export const mockCustomerDTO : CustomerDTO = new CustomerDTO({
  name: 'Juan',
  last_name: 'Pérez',
  phone: '1234567890',
  dni: '12345678'
})

export const mockDebt = new Debt({
  id: 1,
  created_at: new Date(),
  status: 'pending',
  sales_id: 1,
  customer_id: 1,
  amount: 1500,
  pay_method: null,
  updated_at: null,
})

export const mockDebtDTO: DebtDTO = new DebtDTO({
  sales_id: 1,
  customer_id: 1,
  amount: 1500,
})

interface DebtForPayment {
  id: number
  amount: number
  status: DebtData['status']
}

type DebtOverrides = Partial<{
  id: number
  created_at: Date
  status: DebtData['status']
  sales_id: number
  customer_id: number
  amount: number
  pay_method: DebtData['pay_method']
  updated_at: Date | null
}>

export function createMockDebt(overrides: DebtOverrides = {}): Debt {
  return new Debt({
    id: 1,
    created_at: new Date(),
    status: 'pending',
    sales_id: 1,
    customer_id: 1,
    amount: 1500,
    pay_method: null,
    updated_at: null,
    ...overrides,
  })
}

export function createMockDebtForPayment(overrides: Partial<DebtForPayment> = {}): DebtForPayment {
  return {
    id: 1,
    amount: 1500,
    status: 'pending',
    ...overrides,
  }
}

export function createMockRecordDebtPayment(
  overrides: Partial<RecordDebtPaymentData> = {},
): RecordDebtPayment {
  return new RecordDebtPayment({
    paid_amount: 100,
    pay_method: 'cash',
    ...overrides,
  })
}

export function createMockDebtPaymentEvent(
  overrides: Partial<DebtPaymentEventData> = {},
): DebtPaymentEvent {
  return new DebtPaymentEvent({
    id: 1,
    debt_id: 1,
    close_id: 1,
    paid_amount: 100,
    pay_method: 'cash',
    created_at: new Date(),
    ...overrides,
  })
}