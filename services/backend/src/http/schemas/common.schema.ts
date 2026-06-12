import { z } from 'zod'

export const IdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
}).strict()

export const DateQueryValueSchema = z.string().pipe(z.coerce.date())
