import { z } from 'zod'

export const DebtQuerySchema = z.object({
    customer_id: z.coerce.number().int().positive().optional(),
    status: z.enum(['pending', 'paid', 'partial']).optional(),
    close_id: z.coerce.number().int().positive().optional(),
}).strict()
