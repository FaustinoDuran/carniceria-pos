import { Router } from 'express'
import { closeController } from './close.controller'
import { validateBody, validateParams, validateQuery } from '../../http/middlewares/validate.middleware'
import { IdParamsSchema } from '../../http/schemas/common.schema'
import { CloseQuerySchema, FinishCloseRequestSchema } from '../../http/schemas/close.schema'
import { asyncHandler } from '../../http/utils/asyncHandler'

export const closeRouter = Router()

closeRouter.post('/start', asyncHandler(closeController.start))
closeRouter.get('/', validateQuery(CloseQuerySchema), asyncHandler(closeController.search))
closeRouter.get('/active', asyncHandler(closeController.getActive))
closeRouter.post('/:id/finish', validateParams(IdParamsSchema), validateBody(FinishCloseRequestSchema), asyncHandler(closeController.finish))
closeRouter.get('/:id/report/pdf', validateParams(IdParamsSchema), asyncHandler(closeController.downloadPDF))
closeRouter.get('/:id/report', validateParams(IdParamsSchema), asyncHandler(closeController.getReport))
closeRouter.get('/:id', validateParams(IdParamsSchema), asyncHandler(closeController.getById))
