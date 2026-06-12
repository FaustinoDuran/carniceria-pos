import { Request, Response } from 'express'
import { RecordDebtPaymentData } from '@carniceria/shared'
import { debtService } from './debt.service'
import { closeService } from '../closes/close.service'
import { BusinessError } from '../../shared/errors'
import { serializeResource } from '../../http/utils/serialize'

export const debtController = {
    async search(req: Request, res: Response): Promise<void> {
        const debts = await debtService.search(res.locals.query)
        res.json(serializeResource(debts))
    },

    async getById(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const debt = await debtService.getById(id)
        res.json(serializeResource(debt))
    },

    async recordPayment(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        await debtService.getById(id)

        const activeClose = await closeService.getActive()
        if (!activeClose) {
            throw new BusinessError('Cannot record debt payment without an active close')
        }

        const payment = await debtService.recordPayment(id, activeClose.id, res.locals.body as RecordDebtPaymentData)
        if (!payment) {
            throw new BusinessError('Debt payment could not be recorded')
        }

        res.status(201).json(serializeResource(payment))
    },

    async getPayments(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        await debtService.getById(id)

        const payments = await debtService.getPaymentEvents({ debt_id: id })
        res.json(serializeResource(payments))
    },
}
