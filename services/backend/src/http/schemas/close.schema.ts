import { z } from 'zod'
import { DateQueryValueSchema } from './common.schema'

export const CloseQuerySchema = z.object({
    start_at: DateQueryValueSchema.optional(),
    end_at: z.union([z.literal('open'), DateQueryValueSchema]).optional(),
}).strict()

export const FinishCloseRequestSchema = z.object({
    expected_cash: z.number().min(0).nullable().optional(),
}).strict()
