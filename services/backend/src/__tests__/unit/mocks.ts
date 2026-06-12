import { Customer } from '../../features/customers/models/customer.model'
import { CustomerDTO } from '../../features/customers/models/customer.dto'
import { Debt } from '../../features/debts/models/debt.model'
import { DebtDTO } from '../../features/debts/models/debt.dto'
import { DebtPaymentEvent } from '../../features/debts/models/debtPaymentEvent.model'
import { RecordDebtPayment } from '../../features/debts/models/recordDebtPayment.model'
import { Close } from '../../features/closes/models/close.model'
import { Sale } from '../../features/sales/models/sale.model'
import { SaleDetail } from '../../features/sale-details/models/sale-detail.model'
import { SaleDTO, UpdateSaleDTO } from '../../features/sales/models/sale.dto'
import { Expense } from '../../features/expenses/models/expense.model'
import { ExpenseDTO, UpdateExpenseDTO } from '../../features/expenses/models/expense.dto'


// 1. CLOSES MOCKS (Cajas)


export const createMockCloseOpening = (overrides?: Partial<any>): Close => {
    return new Close({
        id: 1,
        start_at: new Date(),
        end_at: null,
        total_income: 0,        // CloseSchema: z.number().min(0) — no acepta null
        total_expense: 0,
        expected_cash: null,
        ...overrides,
    })
}

export const createMockCloseFinished = (overrides?: Partial<any>): Close => {
    return new Close({
        id: 1,
        start_at: new Date(),
        end_at: new Date(),
        total_income: 1500,
        total_expense: 300,
        expected_cash: 1200,
        ...overrides,
    })
}

export const mockCloseOpening = createMockCloseOpening()
export const mockCloseFinished = createMockCloseFinished()


// 2. SALES MOCKS (Ventas)


export const createMockSale = (overrides?: Partial<any>): Sale => {
    return new Sale({
        id: Math.floor(Math.random() * 1000) + 1,
        amount_meat: 0,
        amount_merchandise: 0,
        pay_method: 'cash',     // SalesSchema: z.enum(['cash', 'credit', 'cc', 'debit', 'transfer'])
        close_id: null,
        created_at: new Date(),
        ...overrides,
    })
}

export const createMockSaleDetail = (overrides?: Partial<any>): SaleDetail => {
    return new SaleDetail({
        id: Math.floor(Math.random() * 1000) + 1,
        sale_id: 1,
        cut_name: 'Asado',
        price_per_kg: 1000,
        weight_kg: 2,
        subtotal: 2000,
        created_at: new Date(),
        ...overrides,
    })
}

export const mockSaleDTO = new SaleDTO({
    amount_meat: 100,
    amount_merchandise: 50,
    pay_method: 'cash',
})

export const mockUpdateSaleDTO = new UpdateSaleDTO({
    amount_meat: 150,
    amount_merchandise: 75,
    pay_method: 'transfer',
})

// EXPENSE MOCKS (Gastos)

export const createMockExpense = (overrides?: Partial<any>): Expense => {
    return new Expense({
        id: Math.floor(Math.random() * 1000) + 1,
        amount: 100,
        description: '',
        close_id: null,
        created_at: new Date(),
        category: 'other',   // ExpenseSchema: z.enum(['supplies', 'utilities', 'rent', 'salaries', 'other'])
        ...overrides,
    })
}


// 3. CUSTOMER MOCKS


export const createMockCustomer = (overrides?: Partial<any>): Customer => {
    return new Customer({
        id: 1,
        name: 'Juan',
        last_name: 'Perez',
        phone: '1234567890',
        created_at: new Date(),
        deleted_at: null,
        ...overrides,
    })
}

export const mockCustomer = createMockCustomer()

export const mockCustomerDTO = new CustomerDTO({
    name: 'Juan',
    last_name: 'Perez',
    phone: '1234567890',
    dni: '12345678',
})


// 4. DEBT MOCKS


export const createMockDebt = (overrides?: Partial<any>): Debt => {
    return new Debt({
        id: 1,
        customer_id: 1,
        sales_id: 1,
        amount: 1500,
        status: 'pending',
        pay_method: null,
        created_at: new Date(),
        updated_at: null,
        ...overrides,
    })
}

export const mockDebt = createMockDebt()

export const mockDebtDTO = new DebtDTO({
    sales_id: 1,
    customer_id: 1,
    amount: 1500,
})

export const createMockDebtForPayment = (overrides: Partial<{ id: number; amount: number; status: Debt['status'] }> = {}): { id: number; amount: number; status: Debt['status'] } => {
    return {
        id: 1,
        amount: 1500,
        status: 'pending',
        ...overrides,
    }
}

export const createMockRecordDebtPayment = (overrides?: Partial<any>): RecordDebtPayment => {
    return new RecordDebtPayment({
        paid_amount: 100,
        pay_method: 'cash',
        ...overrides,
    })
}

export const createMockDebtPaymentEvent = (overrides?: Partial<any>): DebtPaymentEvent => {
    return new DebtPaymentEvent({
        id: Math.floor(Math.random() * 1000) + 1,
        debt_id: 1,
        close_id: 1,
        paid_amount: 100,
        pay_method: 'cash',
        created_at: new Date(),
        ...overrides,
    })
}

const mockReportCashSale = createMockSale({ pay_method: 'cash', amount_meat: 600, amount_merchandise: 400 })
const mockReportTransferSale = createMockSale({ pay_method: 'transfer', amount_meat: 300, amount_merchandise: 0 })
const mockReportCardSale = createMockSale({ pay_method: 'credit', amount_meat: 200, amount_merchandise: 0 })
const mockReportCcSale = createMockSale({ pay_method: 'cc', amount_meat: 0, amount_merchandise: 100 })
const mockReportGeneratedDebt = Object.assign(createMockDebt({ amount: 1500 }), {
    customer_name: 'Juan Perez',
})
const mockReportPaidDebt = Object.assign(createMockDebtPaymentEvent({ paid_amount: 100 }), {
    customer_id: 1,
    customer_name: 'Juan Perez',
})
const mockReportExpense = createMockExpense({ amount: 300 })

export const mockCloseReportData = {
    close: createMockCloseFinished({ expected_cash: 1200 }),
    sales: {
        all: [
            mockReportCashSale,
            mockReportTransferSale,
            mockReportCardSale,
            mockReportCcSale,
        ],
        byPayMethod: {
            cash: [mockReportCashSale],
            transfer: [mockReportTransferSale],
            card: [mockReportCardSale],
            cc: [mockReportCcSale],
        },
    },
    debts: {
        generated: [mockReportGeneratedDebt],
        paid: [mockReportPaidDebt],
    },
    expenses: [mockReportExpense],
    summary: {
        totalMeat: 1100,
        totalMerchandise: 500,
        totalSales: 1600,
        totalCash: 1000,
        totalTransfer: 300,
        totalCard: 200,
        totalDebtGenerated: 1500,
        totalDebtPaid: 100,
        totalExpenses: 300,
        realIncome: 1300,
        expectedCash: 1200,
    },
}

// 5. EXPENSE MOCKS DTOs

export const mockExpenseDTO = new ExpenseDTO({
    category: 'other',
    amount: 100,
    description: 'Test expense',
})

export const mockUpdateExpenseDTO = new UpdateExpenseDTO({
    category: 'supplies',
    amount: 200,
    description: 'Updated expense',
})

export const mockExpense = createMockExpense()
