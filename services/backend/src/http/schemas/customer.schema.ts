import { z } from 'zod'

export const CustomerQuerySchema = z.object({
    name: z.string().trim().min(1).optional(),
    dni: z.string().trim().min(1).optional(),
}).strict()
