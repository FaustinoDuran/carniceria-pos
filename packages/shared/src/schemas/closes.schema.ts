import { z } from 'zod'

export const CreateCloseSchema = z.object({
  start_at: z.iso.datetime(),
})

export const FinishCloseSchema = z.object({
  end_at: z.iso.datetime(),
  total_income: z.number().min(0).default(0),
  total_expense: z.number().min(0).default(0),
})

export type CreateCloseType = z.infer<typeof CreateCloseSchema>
export type FinishCloseType = z.infer<typeof FinishCloseSchema>