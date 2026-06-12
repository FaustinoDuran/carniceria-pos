import { Request, Response } from 'express'
import { CreateCustomerData, UpdateCustomerData } from '@carniceria/shared'
import { customerService } from './customer.service'
import { serializeResource } from '../../http/utils/serialize'

export const customerController = {
    async search(req: Request, res: Response): Promise<void> {
        const filters = res.locals.query as { name?: string; dni?: string }
        const customers = await customerService.search(filters)
        res.json(serializeResource(customers))
    },

    async searchDeleted(req: Request, res: Response): Promise<void> {
        const filters = res.locals.query as { name?: string; dni?: string }
        const customers = await customerService.search({ ...filters, deleted: true })
        res.json(serializeResource(customers))
    },

    async getById(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const customer = await customerService.getById(id)
        res.json(serializeResource(customer))
    },

    async register(req: Request, res: Response): Promise<void> {
        const customer = await customerService.register(res.locals.body as CreateCustomerData)
        res.status(201).json(serializeResource(customer))
    },

    async update(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const customer = await customerService.update(id, res.locals.body as UpdateCustomerData)
        res.json(serializeResource(customer))
    },

    async delete(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        await customerService.delete(id)
        res.status(204).send()
    },

    async restore(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const customer = await customerService.restore(id)
        res.json(serializeResource(customer))
    },
}
