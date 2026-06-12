import { Router } from 'express'
import { saleController } from './sale.controller'
import { validateBody, validateParams, validateQuery } from '../../http/middlewares/validate.middleware'
import { IdParamsSchema } from '../../http/schemas/common.schema'
import { CreateSaleRequestSchema, SaleQuerySchema, UpdateSaleRequestSchema } from '../../http/schemas/sale.schema'
import { asyncHandler } from '../../http/utils/asyncHandler'

export const saleRouter = Router()

saleRouter.get('/', validateQuery(SaleQuerySchema), asyncHandler(saleController.search))
saleRouter.get('/:id/details', validateParams(IdParamsSchema), asyncHandler(saleController.getDetails))
saleRouter.get('/:id/remito/pdf', validateParams(IdParamsSchema), asyncHandler(saleController.downloadRemitoPDF))
saleRouter.get('/:id', validateParams(IdParamsSchema), asyncHandler(saleController.getById))
saleRouter.post('/', validateBody(CreateSaleRequestSchema), asyncHandler(saleController.create))
saleRouter.put('/:id', validateParams(IdParamsSchema), validateBody(UpdateSaleRequestSchema), asyncHandler(saleController.update))
saleRouter.delete('/:id', validateParams(IdParamsSchema), asyncHandler(saleController.delete))
