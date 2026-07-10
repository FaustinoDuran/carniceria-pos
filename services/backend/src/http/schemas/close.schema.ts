import { z } from 'zod'
import { DateQueryValueSchema } from './common.schema'

export const CloseQuerySchema = z.object({
    start_at: DateQueryValueSchema.optional(),
    end_at: z.union([z.literal('open'), DateQueryValueSchema]).optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
}).strict()

export const FinishCloseRequestSchema = z.object({
    expected_cash: z.number().min(0).nullable().optional(),
}).strict()
