import { z } from 'zod'
import { CreateSaleDetailSchema, CreateSalesSchema, UpdateSalesSchema } from '@carniceria/shared'
import { DateQueryValueSchema } from './common.schema'

const PayMethodSchema = z.enum(['cash', 'credit', 'cc', 'debit', 'transfer'])

export const SaleQuerySchema = z.object({
    date: z.union([z.literal('today'), DateQueryValueSchema]).optional(),
    close_id: z.union([z.literal('null'), z.coerce.number().int().positive()]).optional(),
    pay_method: PayMethodSchema.optional(),
}).strict()

export const CreateSaleRequestSchema = CreateSalesSchema.extend({
    details: z.array(CreateSaleDetailSchema).optional(),
    customer_id: z.number().int().positive().optional(),
}).strict().superRefine((data, ctx) => {
    if (data.pay_method === 'cc' && data.customer_id === undefined) {
        ctx.addIssue({
            code: 'custom',
            path: ['customer_id'],
            message: 'Customer ID is required for cc sale',
        })
    }
})

export const UpdateSaleRequestSchema = UpdateSalesSchema.extend({
    details: z.array(CreateSaleDetailSchema).optional(),
    customer_id: z.number().int().positive().optional(),
}).strict()
