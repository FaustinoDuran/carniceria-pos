import { Router } from 'express'
import { CreateExpensesSchema, UpdateExpensesSchema } from '@carniceria/shared'
import { expenseController } from './expense.controller'
import { validateBody, validateParams, validateQuery } from '../../http/middlewares/validate.middleware'
import { IdParamsSchema } from '../../http/schemas/common.schema'
import { ExpenseQuerySchema } from '../../http/schemas/expense.schema'
import { asyncHandler } from '../../http/utils/asyncHandler'

export const expenseRouter = Router()

expenseRouter.get('/', validateQuery(ExpenseQuerySchema), asyncHandler(expenseController.search))
expenseRouter.get('/:id', validateParams(IdParamsSchema), asyncHandler(expenseController.getById))
expenseRouter.post('/', validateBody(CreateExpensesSchema), asyncHandler(expenseController.create))
expenseRouter.put('/:id', validateParams(IdParamsSchema), validateBody(UpdateExpensesSchema), asyncHandler(expenseController.update))
expenseRouter.delete('/:id', validateParams(IdParamsSchema), asyncHandler(expenseController.delete))
