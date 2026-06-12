import { Router } from 'express'
import { RecordDebtPaymentSchema } from '@carniceria/shared'
import { debtController } from './debt.controller'
import { validateBody, validateParams, validateQuery } from '../../http/middlewares/validate.middleware'
import { IdParamsSchema } from '../../http/schemas/common.schema'
import { DebtQuerySchema } from '../../http/schemas/debt.schema'
import { asyncHandler } from '../../http/utils/asyncHandler'

export const debtRouter = Router()

debtRouter.get('/', validateQuery(DebtQuerySchema), asyncHandler(debtController.search))
debtRouter.get('/:id', validateParams(IdParamsSchema), asyncHandler(debtController.getById))
debtRouter.post('/:id/payments', validateParams(IdParamsSchema), validateBody(RecordDebtPaymentSchema), asyncHandler(debtController.recordPayment))
debtRouter.get('/:id/payments', validateParams(IdParamsSchema), asyncHandler(debtController.getPayments))
