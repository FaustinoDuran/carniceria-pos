import { z } from 'zod'
import { DateQueryValueSchema } from './common.schema'

export const ExpenseQuerySchema = z.object({
    close_id: z.union([z.literal('null'), z.coerce.number().int().positive()]).optional(),
    date: DateQueryValueSchema.optional(),
}).strict()
