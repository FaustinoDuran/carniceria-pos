import { Customer } from '../../features/customers/models/customer.model';
import { CustomerDTO } from '../../features/customers/models/customer.dto';
import { Debt } from '../../features/debts/models/debt.model';

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
  amount: 1500
})