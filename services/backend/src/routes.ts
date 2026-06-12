import { Router } from 'express'
import { customerRouter } from './features/customers/customer.routes'
import { closeRouter } from './features/closes/close.routes'
import { expenseRouter } from './features/expenses/expense.routes'
import { saleRouter } from './features/sales/sale.routes'
import { debtRouter } from './features/debts/debt.routes'

export const apiRouter = Router()

apiRouter.use('/customers', customerRouter)
apiRouter.use('/closes', closeRouter)
apiRouter.use('/expenses', expenseRouter)
apiRouter.use('/sales', saleRouter)
apiRouter.use('/debts', debtRouter)
