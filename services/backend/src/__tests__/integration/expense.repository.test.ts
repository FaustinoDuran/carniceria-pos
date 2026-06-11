import { expenseRepository } from '../../features/expenses/expense.repository'
import { createTestClose, createTestExpense, finishTestClose } from '../helpers/createTestData'

describe('ExpenseRepository', () => {

    describe('create', () => {

        it('should create a new expense', async () => {
            const expense = await createTestExpense(500)
            
            expect(expense).toHaveProperty('id')
            expect(expense.category).toBe('Test')
            expect(expense.amount).toBe(500)
            expect(expense.description).toBe('Test expense')
        })
    })

    describe('getAll', () => {
        it('should return all expenses', async () => {
            await createTestExpense(500)
            await createTestExpense(300)

            const expenses = await expenseRepository.getAll()
            expect(expenses).toHaveLength(2)
        })

        it('should return expenses filtered by id', async () => {
            const expense = await createTestExpense(500)
            await createTestExpense(300)

            const expensesReturned = await expenseRepository.getAll({ id: expense.id })

            expect(expensesReturned.length).toBe(1)
            expect(expense.id).toBe(expensesReturned[0].id)
        })

        it('should return expenses filtered by created_at', async () => {
            const expense = await createTestExpense(500)

            const expensesReturned = await expenseRepository.getAll({ created_at: expense.created_at })
            const totalExpenses = await expenseRepository.getAll()

            expect(expensesReturned.length).toBe(1)
            expect(totalExpenses.length).toBe(1)
            expect(expensesReturned[0].id).toBe(expense.id)
        })

        it('should return expenses filtered by close_id', async () => {
            const expense = await createTestExpense(500)

            const expensesReturned = await expenseRepository.getAll({ close_id: null })
            const totalExpenses = await expenseRepository.getAll()

            expect(expensesReturned.length).toBe(1)
            expect(totalExpenses.length).toBe(1)
            expect(expensesReturned[0].id).toBe(expense.id)
        })
    })

    describe('delete', () => {
        it('should delete an expense', async () => {
            const expense = await createTestExpense(500)

            const deleted = await expenseRepository.delete(expense.id)
            const expenses = await expenseRepository.getAll()

            expect(deleted).toBe(true)
            expect(expenses).toHaveLength(0)
        })

        it('should not delete an expense that is already closed', async () => {
            const expense = await createTestExpense(500)
            const close = await createTestClose()

            await expenseRepository.setClosed(close.id, [expense.id])

            const deleted = await expenseRepository.delete(expense.id)
            const expenses = await expenseRepository.getAll()

            expect(deleted).toBe(false)
            expect(expenses).toHaveLength(1)
        })
    })
    
    describe('setClosed', () => {
        it('should set close_id for a list of expenses', async () => {
            const expense1 = await createTestExpense(500)
            const expense2 = await createTestExpense(300)
            const close = await createTestClose()

            const closed = await expenseRepository.setClosed(close.id, [expense1.id, expense2.id])
            const expenses = await expenseRepository.getAll({ close_id: close.id })

            expect(closed).toBe(true)
            expect(expenses).toHaveLength(2)
            expect(expenses[0].close_id).toBe(close.id)
            expect(expenses[1].close_id).toBe(close.id)
        })

        it('should not set close_id for expenses that are already closed', async () => {
            const expense1 = await createTestExpense(500)
            const expense2 = await createTestExpense(300)
            const close1 = await createTestClose()

            await expenseRepository.setClosed(close1.id, [expense1.id])
            await finishTestClose(close1.id)
            const close2 = await createTestClose()
            const closed = await expenseRepository.setClosed(close2.id, [expense1.id, expense2.id])
            const expensesClose1 = await expenseRepository.getAll({ close_id: close1.id })
            const expensesClose2 = await expenseRepository.getAll({ close_id: close2.id })

            expect(closed).toBe(true)
            expect(expensesClose1).toHaveLength(1)
            expect(expensesClose1[0].id).toBe(expense1.id)
            expect(expensesClose2).toHaveLength(1)
            expect(expensesClose2[0].id).toBe(expense2.id)
        })
    })

    describe('update', () => {
        it('should update expense category', async () => {
            const expense = await createTestExpense(500)

            const updated = await expenseRepository.update(expense.id, { category: 'Updated' })

            expect(updated).not.toBeNull()
            expect(updated?.category).toBe('Updated')
            expect(updated?.amount).toBe(500)
        })

        it('should update expense amount', async () => {
            const expense = await createTestExpense(500)

            const updated = await expenseRepository.update(expense.id, { amount: 750 })

            expect(updated).not.toBeNull()
            expect(updated?.amount).toBe(750)
            expect(updated?.category).toBe('Test')
        })

        it('should update expense description', async () => {
            const expense = await createTestExpense(500)

            const updated = await expenseRepository.update(expense.id, { description: 'Updated description' })

            expect(updated).not.toBeNull()
            expect(updated?.description).toBe('Updated description')
        })

        it('should update multiple expense fields at once', async () => {
            const expense = await createTestExpense(500)

            const updated = await expenseRepository.update(expense.id, { 
                category: 'New Category',
                amount: 1000,
                description: 'New description'
            })

            expect(updated).not.toBeNull()
            expect(updated?.category).toBe('New Category')
            expect(updated?.amount).toBe(1000)
            expect(updated?.description).toBe('New description')
        })

        it('should not update an expense that is already closed', async () => {
            const expense = await createTestExpense(500)
            const close = await createTestClose()

            await expenseRepository.setClosed(close.id, [expense.id])

            const updated = await expenseRepository.update(expense.id, { amount: 750 })

            expect(updated).toBeNull()
        })

        it('should return null when no fields are provided for update', async () => {
            const expense = await createTestExpense(500)

            const updated = await expenseRepository.update(expense.id, {})

            expect(updated).toBeNull()
        })
    })
})