import { debtRepository } from '../../features/debts/debt.repository'
import { debtService } from '../../features/debts/debt.service'
import {
    createTestCustomer,
    createTestSale,
    createTestDebt,
    createRecordDebtPaymentData,
    createTestClose,
    finishTestClose,
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
            await debtService.recordPayment(
                debt1.id,
                close.id,
                createRecordDebtPaymentData(500, 'cash')
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

            const event = await debtService.recordPayment(
                debt.id,
                close.id,
                createRecordDebtPaymentData(500, 'cash')
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

            await debtService.recordPayment(
                debt.id,
                close1.id,
                createRecordDebtPaymentData(500, 'cash')
            )

            await finishTestClose(close1.id)
            const close2 = await createTestClose()

            const finalEvent = await debtService.recordPayment(
                debt.id,
                close2.id,
                createRecordDebtPaymentData(1000, 'transfer')
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

            const result = await debtService.recordPayment(
                debt.id,
                close.id,
                createRecordDebtPaymentData(2000, 'cash')
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

            await debtService.recordPayment(
                debt.id,
                close.id,
                createRecordDebtPaymentData(1500, 'cash')
            )

            const result = await debtService.recordPayment(
                debt.id,
                close.id,
                createRecordDebtPaymentData(100, 'cash')
            )

            const events = await debtRepository.getPaymentEvents({ debt_id: debt.id })

            expect(result).toBeNull()
            expect(events).toHaveLength(1)
        })

        it('should return null if trying to pay a non existing debt', async () => {
            const close = await createTestClose()
            const result = await debtService.recordPayment(
                9999,
                close.id,
                createRecordDebtPaymentData(100, 'cash')
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

            await debtService.recordPayment(
                debt1.id,
                close1.id,
                createRecordDebtPaymentData(300, 'cash')
            )

            await debtService.recordPayment(
                debt2.id,
                close1.id,
                createRecordDebtPaymentData(400, 'debit')
            )

            await finishTestClose(close1.id)
            const close2 = await createTestClose()

            const secondEvent = await debtService.recordPayment(
                debt1.id,
                close2.id,
                createRecordDebtPaymentData(200, 'transfer')
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