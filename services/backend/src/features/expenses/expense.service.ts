import { ExpenseFilters, IExpensesServies } from './expense.service.interface'
import { Expense } from './models/expense.model'
import { ExpenseDTO, UpdateExpenseDTO } from './models/expense.dto'
import { expenseRepository } from './expense.repository'
import { closeRepository } from '../closes/close.repository'
import { BusinessError, NotFoundError } from '../../shared/errors'

export class ExpenseService implements IExpensesServies {
    async create(data: unknown): Promise<Expense> {
        
        const activeClose = await closeRepository.getActive()
        if (!activeClose) {
            throw new BusinessError('Cannot create expense without an active close')
        }

        
        const dto = new ExpenseDTO(data)
        return expenseRepository.create(dto)
    }

    async update(id: number, data: unknown): Promise<Expense> {
        const expense = await expenseRepository.getById(id)
        if (!expense) {
            throw new NotFoundError('Expense not found')
        }

       
        if (expense.close_id !== null) {
            throw new BusinessError('Cannot update a closed expense')
        }

        const dto = new UpdateExpenseDTO(data)
        const updated = await expenseRepository.update(id, {
            category: dto.category,
            amount: dto.amount,
            description: dto.description,
        })

        if (!updated) {
            throw new NotFoundError('Expense could not be updated')
        }

        return updated
    }

    async delete(id: number): Promise<void> {
        const expense = await expenseRepository.getById(id)
        if (!expense) {
            throw new NotFoundError('Expense not found')
        }

        
        if (expense.close_id !== null) {
            throw new BusinessError('Cannot delete a closed expense')
        }

        const deleted = await expenseRepository.delete(id)
        if (!deleted) {
            throw new BusinessError('Expense could not be deleted')
        }
    }

    async search(filters?: ExpenseFilters): Promise<Expense[]> {
        if (!filters) {
            return expenseRepository.getAll(undefined)
        }

        return expenseRepository.getAll({
            category: filters.category,
            close_id: filters.close_id,
            created_at: filters.date,
        })
    }

    async getById(id: number): Promise<Expense> {
        const expense = await expenseRepository.getById(id)
        if (!expense) {
            throw new NotFoundError('Expense not found')
        }
        return expense
    }
}

export const expenseService = new ExpenseService()
