import { debtRepository } from '../../features/debts/debt.repository'
import { createTestCustomer, createTestSale, createTestDebt, createUpdateDebtData } from '../helpers/createTestData'



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

            const debts = await debtRepository.getAll({ id: debt.id })
            expect(debts).toHaveLength(1)
            expect(debts[0].id).toBe(debt.id)
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
            await createTestDebt(sale1.id, customer.id)
            await createTestDebt(sale2.id, customer2.id)

            const debts = await debtRepository.getAll({ status: 'pending' })
            expect(debts).toHaveLength(2)
            
            await debtRepository.update(debts[0].id, await createUpdateDebtData(1500, 'paid'))
            const pendingDebts = await debtRepository.getAll({ status: 'pending' })
            
            expect(pendingDebts).toHaveLength(1)
        })
    })

    describe('update', () => {

        it('should return updated debt', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale()
            const debt = await createTestDebt(sale.id, customer.id)
            const update = await createUpdateDebtData(1500, 'paid')
            const updatedDebt = await debtRepository.update(debt.id, update)

            expect(updatedDebt).not.toBeNull()
            expect(updatedDebt?.status).toBe('paid')
            expect(updatedDebt?.amount).toBe(1500)        
        })

        it('should return null if trying to update a paid debt', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale()
            const debt = await createTestDebt(sale.id, customer.id)
            await debtRepository.update(debt.id, await createUpdateDebtData(1500, 'paid'))
            const result = await debtRepository.update(debt.id, await createUpdateDebtData(1500, 'pending'))

            expect(result).toBeNull()
        })

        it('should return null if trying to update a non existing debt', async () => {
            const result = await debtRepository.update(9999, await createUpdateDebtData(1500, 'paid'))
            expect(result).toBeNull()
        })
    })
})