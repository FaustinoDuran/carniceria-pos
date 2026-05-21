import { debtRepository } from '../../features/debts/debt.repository'
import {
    createTestCustomer,
    createTestSale,
    createTestDebt,
    createRecordDebtPaymentData,
    createTestClose,
} from '../helpers/createTestData'



describe('DebtRepository', () => {

    describe('create', () => {

        it('should create a debt', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale()
            const debt = await createTestDebt(sale.id, customer.id)

            expect(debt.id).toBeDefined()
            expect(debt.sales_id).toBe(sale.id)
            expect(debt.customer_id).toBe(customer.id)
            expect(debt.amount).toBe(1500)
            expect(debt.created_at).toBeInstanceOf(Date)
            expect(debt.status).toBe('pending')

        })
    })

    describe('getAll', () => {

        it('should return all debts', async () => {
            const customer = await createTestCustomer()
            const customer2 = await createTestCustomer()
            const sale1 = await createTestSale()
            const sale2 = await createTestSale()
            await createTestDebt(sale1.id, customer.id)
            await createTestDebt(sale2.id, customer2.id)

            const debts = await debtRepository.getAll()
            expect(debts).toHaveLength(2)
            
        })
        it('should return debts by id', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale()
            const debt = await createTestDebt(sale.id, customer.id)


            const customer2 = await createTestCustomer()
            const sale2 = await createTestSale()
            await createTestDebt(sale2.id, customer2.id)

            const debts = await debtRepository.getAll({ id: debt.id })
            expect(debts).toHaveLength(1)
            expect(debts[0].id).toBe(debt.id)
            expect(debts[0].amount).toBe(debt.amount)
        })

        it('should return debts filtered by customer_id', async () => {
            const customer = await createTestCustomer()
            const customer2 = await createTestCustomer()
            const sale1 = await createTestSale()
            const sale2 = await createTestSale()
            await createTestDebt(sale1.id, customer.id)
            await createTestDebt(sale2.id, customer2.id)

            const debts = await debtRepository.getAll({ customer_id: customer.id })

            expect(debts).toHaveLength(1)
            expect(debts[0].customer_id).toBe(customer.id)
        })

        it('should return debts filtered by status', async () => {
            const customer = await createTestCustomer()
            const customer2 = await createTestCustomer()
            const sale1 = await createTestSale()
            const sale2 = await createTestSale()
            const debt1 = await createTestDebt(sale1.id, customer.id)
            await createTestDebt(sale2.id, customer2.id)

            const close = await createTestClose()
            await debtRepository.recordPayment(
                debt1.id,
                createRecordDebtPaymentData(500, close.id, 'cash')
            )

            const debts = await debtRepository.getAll({ status: 'pending' })
            const partialDebts = await debtRepository.getAll({ status: 'partial' })

            expect(debts).toHaveLength(1)
            expect(partialDebts).toHaveLength(1)
            expect(partialDebts[0].id).toBe(debt1.id)
        })
    })

    describe('recordPayment', () => {

        it('should create a payment event and reduce debt amount', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale()
            const debt = await createTestDebt(sale.id, customer.id)
            const close = await createTestClose()

            const event = await debtRepository.recordPayment(
                debt.id,
                createRecordDebtPaymentData(500, close.id, 'cash')
            )

            const updatedDebt = await debtRepository.getAll({ id: debt.id })

            expect(event).not.toBeNull()
            expect(event?.debt_id).toBe(debt.id)
            expect(event?.close_id).toBe(close.id)
            expect(event?.paid_amount).toBe(500)
            expect(event?.pay_method).toBe('cash')
            expect(updatedDebt[0].status).toBe('partial')
            expect(updatedDebt[0].amount).toBe(1000)
        })

        it('should mark debt as paid when remaining amount reaches zero', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale()
            const debt = await createTestDebt(sale.id, customer.id)
            const close1 = await createTestClose()
            const close2 = await createTestClose()

            await debtRepository.recordPayment(
                debt.id,
                createRecordDebtPaymentData(500, close1.id, 'cash')
            )

            const finalEvent = await debtRepository.recordPayment(
                debt.id,
                createRecordDebtPaymentData(1000, close2.id, 'transfer')
            )

            const updatedDebt = await debtRepository.getAll({ id: debt.id })

            expect(finalEvent).not.toBeNull()
            expect(finalEvent?.pay_method).toBe('transfer')
            expect(updatedDebt[0].status).toBe('paid')
            expect(updatedDebt[0].amount).toBe(0)
        })

        it('should return null when paid amount exceeds remaining debt', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale()
            const debt = await createTestDebt(sale.id, customer.id)
            const close = await createTestClose()

            const result = await debtRepository.recordPayment(
                debt.id,
                createRecordDebtPaymentData(2000, close.id, 'cash')
            )

            const updatedDebt = await debtRepository.getAll({ id: debt.id })
            const events = await debtRepository.getPaymentEvents({ debt_id: debt.id })

            expect(result).toBeNull()
            expect(updatedDebt[0].status).toBe('pending')
            expect(updatedDebt[0].amount).toBe(1500)
            expect(events).toHaveLength(0)
        })

        it('should return null if trying to pay an already paid debt', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale()
            const debt = await createTestDebt(sale.id, customer.id)
            const close = await createTestClose()

            await debtRepository.recordPayment(
                debt.id,
                createRecordDebtPaymentData(1500, close.id, 'cash')
            )

            const result = await debtRepository.recordPayment(
                debt.id,
                createRecordDebtPaymentData(100, close.id, 'cash')
            )

            const events = await debtRepository.getPaymentEvents({ debt_id: debt.id })

            expect(result).toBeNull()
            expect(events).toHaveLength(1)
        })

        it('should return null if trying to pay a non existing debt', async () => {
            const close = await createTestClose()
            const result = await debtRepository.recordPayment(
                9999,
                createRecordDebtPaymentData(100, close.id, 'cash')
            )

            expect(result).toBeNull()
        })
    })

    describe('getPaymentEvents', () => {
        it('should return payment events filtered by debt_id and close_id', async () => {
            const customer1 = await createTestCustomer()
            const customer2 = await createTestCustomer()
            const sale1 = await createTestSale()
            const sale2 = await createTestSale()
            const debt1 = await createTestDebt(sale1.id, customer1.id)
            const debt2 = await createTestDebt(sale2.id, customer2.id)
            const close1 = await createTestClose()
            const close2 = await createTestClose()

            await debtRepository.recordPayment(
                debt1.id,
                createRecordDebtPaymentData(300, close1.id, 'cash')
            )

            const secondEvent = await debtRepository.recordPayment(
                debt1.id,
                createRecordDebtPaymentData(200, close2.id, 'transfer')
            )

            await debtRepository.recordPayment(
                debt2.id,
                createRecordDebtPaymentData(400, close1.id, 'debit')
            )

            const byDebt = await debtRepository.getPaymentEvents({ debt_id: debt1.id })
            const byClose = await debtRepository.getPaymentEvents({ close_id: close1.id })
            const byId = await debtRepository.getPaymentEvents({ id: secondEvent?.id })

            expect(byDebt).toHaveLength(2)
            expect(byDebt.every((event) => event.debt_id === debt1.id)).toBe(true)
            expect(byClose).toHaveLength(2)
            expect(byId).toHaveLength(1)
            expect(byId[0].id).toBe(secondEvent?.id)
        })
    })
})