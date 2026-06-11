import { expenseService } from '../../features/expenses/expense.service'
import { expenseRepository } from '../../features/expenses/expense.repository'
import { closeRepository } from '../../features/closes/close.repository'
import { createMockExpense, createMockCloseOpening, mockExpenseDTO, mockUpdateExpenseDTO } from './mocks'
import { BusinessError, NotFoundError } from '../../shared/errors'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../features/expenses/expense.repository')
vi.mock('../../features/closes/close.repository')

describe('ExpenseService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('create', () => {
        it('should create an expense when there is an active close', async () => {
            const mockClose = createMockCloseOpening()
            const mockExpense = createMockExpense()

            vi.spyOn(closeRepository, 'getActive').mockResolvedValue(mockClose)
            vi.spyOn(expenseRepository, 'create').mockResolvedValue(mockExpense)

            const result = await expenseService.create(mockExpenseDTO)

            expect(result).toEqual(mockExpense)
            expect(closeRepository.getActive).toHaveBeenCalledTimes(1)
            expect(expenseRepository.create).toHaveBeenCalledTimes(1)
        })

        it('should throw BusinessError when trying to create an expense without an active close', async () => {
            vi.spyOn(closeRepository, 'getActive').mockResolvedValue(null)

            await expect(expenseService.create(mockExpenseDTO)).rejects.toBeInstanceOf(BusinessError)
            expect(closeRepository.getActive).toHaveBeenCalledTimes(1)
            expect(expenseRepository.create).not.toHaveBeenCalled()
        })
    })

    describe('update', () => {
        it('should update an open expense', async () => {
            const mockExpense = createMockExpense({ close_id: null })
            const updatedExpense = createMockExpense({ close_id: null, category: 'supplies', amount: 200 })

            vi.spyOn(expenseRepository, 'getById').mockResolvedValue(mockExpense)
            vi.spyOn(expenseRepository, 'update').mockResolvedValue(updatedExpense)

            const result = await expenseService.update(mockExpense.id, mockUpdateExpenseDTO)

            expect(result).toEqual(updatedExpense)
            expect(expenseRepository.getById).toHaveBeenCalledWith(mockExpense.id)
            expect(expenseRepository.update).toHaveBeenCalledTimes(1)
        })

        it('should throw NotFoundError when expense does not exist', async () => {
            vi.spyOn(expenseRepository, 'getById').mockResolvedValue(null)

            await expect(expenseService.update(999, mockUpdateExpenseDTO)).rejects.toBeInstanceOf(NotFoundError)
            expect(expenseRepository.update).not.toHaveBeenCalled()
        })

        it('should throw BusinessError when trying to update a closed expense', async () => {
            const closedExpense = createMockExpense({ close_id: 1 })

            vi.spyOn(expenseRepository, 'getById').mockResolvedValue(closedExpense)

            await expect(expenseService.update(closedExpense.id, mockUpdateExpenseDTO)).rejects.toBeInstanceOf(BusinessError)
            expect(expenseRepository.update).not.toHaveBeenCalled()
        })
    })

    describe('delete', () => {
        it('should delete an open expense', async () => {
            const mockExpense = createMockExpense({ close_id: null })

            vi.spyOn(expenseRepository, 'getById').mockResolvedValue(mockExpense)
            vi.spyOn(expenseRepository, 'delete').mockResolvedValue(true)

            await expenseService.delete(mockExpense.id)

            expect(expenseRepository.getById).toHaveBeenCalledWith(mockExpense.id)
            expect(expenseRepository.delete).toHaveBeenCalledWith(mockExpense.id)
        })

        it('should throw NotFoundError when expense does not exist', async () => {
            vi.spyOn(expenseRepository, 'getById').mockResolvedValue(null)

            await expect(expenseService.delete(999)).rejects.toBeInstanceOf(NotFoundError)
            expect(expenseRepository.delete).not.toHaveBeenCalled()
        })

        it('should throw BusinessError when trying to delete a closed expense', async () => {
            const closedExpense = createMockExpense({ close_id: 1 })

            vi.spyOn(expenseRepository, 'getById').mockResolvedValue(closedExpense)

            await expect(expenseService.delete(closedExpense.id)).rejects.toBeInstanceOf(BusinessError)
            expect(expenseRepository.delete).not.toHaveBeenCalled()
        })

        it('should throw BusinessError if delete operation fails', async () => {
            const mockExpense = createMockExpense({ close_id: null })

            vi.spyOn(expenseRepository, 'getAll').mockResolvedValue([mockExpense])
            vi.spyOn(expenseRepository, 'delete').mockResolvedValue(false)

            await expect(expenseService.delete(mockExpense.id)).rejects.toBeInstanceOf(BusinessError)
        })
    })

    describe('search', () => {
        it('should return all expenses when no filters are provided', async () => {
            const mockExpense1 = createMockExpense()
            const mockExpense2 = createMockExpense()

            vi.spyOn(expenseRepository, 'getAll').mockResolvedValue([mockExpense1, mockExpense2])

            const result = await expenseService.search()

            expect(result).toHaveLength(2)
            expect(expenseRepository.getAll).toHaveBeenCalledWith(undefined)
        })

        it('should search expenses by category', async () => {
            const mockExpense = createMockExpense({ category: 'supplies' })

            vi.spyOn(expenseRepository, 'getAll').mockResolvedValue([mockExpense])

            const result = await expenseService.search({ category: 'supplies' })

            expect(result).toHaveLength(1)
            expect(result[0].category).toBe('supplies')
            expect(expenseRepository.getAll).toHaveBeenCalledWith({ category: 'supplies' })
        })

        it('should search expenses by close_id', async () => {
            const mockExpense = createMockExpense({ close_id: 1 })

            vi.spyOn(expenseRepository, 'getAll').mockResolvedValue([mockExpense])

            const result = await expenseService.search({ close_id: 1 })

            expect(result).toHaveLength(1)
            expect(result[0].close_id).toBe(1)
        })

        it('should return empty array when search with filters returns no results', async () => {
            vi.spyOn(expenseRepository, 'getAll').mockResolvedValue([])

            const result = await expenseService.search({ category: 'nonexistent' })

            expect(result).toHaveLength(0)
        })
    })

    describe('getById', () => {
        it('should return an expense by id', async () => {
            const mockExpense = createMockExpense({ id: 5 })

            vi.spyOn(expenseRepository, 'getById').mockResolvedValue(mockExpense)

            const result = await expenseService.getById(5)

            expect(result).toEqual(mockExpense)
            expect(expenseRepository.getById).toHaveBeenCalledWith(5)
        })

        it('should throw NotFoundError when expense does not exist', async () => {
            vi.spyOn(expenseRepository, 'getById').mockResolvedValue(null)

            await expect(expenseService.getById(999)).rejects.toBeInstanceOf(NotFoundError)
        })
    })
})
