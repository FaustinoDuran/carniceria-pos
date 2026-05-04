import { expenseRepository } from '../../features/expenses/expense.repository'
import { createTestClose, createTestExpense } from '../helpers/createTestData'

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
            const close2 = await createTestClose()

            await expenseRepository.setClosed(close1.id, [expense1.id])
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
})