import { Request, Response } from 'express'
import { CreateExpensesData, UpdateExpensesData } from '@carniceria/shared'
import { expenseService } from './expense.service'
import { serializeResource } from '../../http/utils/serialize'

export const expenseController = {
    async search(req: Request, res: Response): Promise<void> {
        const query = res.locals.query as { close_id?: number | 'null'; date?: Date }
        const expenses = await expenseService.search({
            close_id: query.close_id === 'null' ? null : query.close_id,
            date: query.date,
        })
        res.json(serializeResource(expenses))
    },

    async getById(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const expense = await expenseService.getById(id)
        res.json(serializeResource(expense))
    },

    async create(req: Request, res: Response): Promise<void> {
        const expense = await expenseService.create(res.locals.body as CreateExpensesData)
        res.status(201).json(serializeResource(expense))
    },

    async update(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const expense = await expenseService.update(id, res.locals.body as UpdateExpensesData)
        res.json(serializeResource(expense))
    },

    async delete(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        await expenseService.delete(id)
        res.status(204).send()
    },
}
