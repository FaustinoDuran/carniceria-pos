import { Router } from 'express'
import { CreateCustomerSchema, UpdateCustomerSchema } from '@carniceria/shared'
import { customerController } from './customer.controller'
import { validateBody, validateParams, validateQuery } from '../../http/middlewares/validate.middleware'
import { IdParamsSchema } from '../../http/schemas/common.schema'
import { CustomerQuerySchema } from '../../http/schemas/customer.schema'
import { asyncHandler } from '../../http/utils/asyncHandler'

export const customerRouter = Router()

customerRouter.get('/', validateQuery(CustomerQuerySchema), asyncHandler(customerController.search))
customerRouter.get('/deleted', validateQuery(CustomerQuerySchema), asyncHandler(customerController.searchDeleted))
customerRouter.get('/:id', validateParams(IdParamsSchema), asyncHandler(customerController.getById))
customerRouter.post('/', validateBody(CreateCustomerSchema), asyncHandler(customerController.register))
customerRouter.put('/:id', validateParams(IdParamsSchema), validateBody(UpdateCustomerSchema), asyncHandler(customerController.update))
customerRouter.delete('/:id', validateParams(IdParamsSchema), asyncHandler(customerController.delete))
customerRouter.patch('/:id/restore', validateParams(IdParamsSchema), asyncHandler(customerController.restore))
