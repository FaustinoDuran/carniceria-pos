import { z } from 'zod'

export const CreateCloseSchema = z.object({
  start_at: z.coerce.date(),
})

export const FinishCloseSchema = z.object({
  end_at: z.coerce.date(),
  total_income: z.number().min(0).default(0),
  total_expense: z.number().min(0).default(0),
  expected_cash: z.number().min(0).nullable(),
  expected_card: z.number().min(0).nullable().default(null),
})

export const CloseSchema = z.object({
  id: z.number().int().positive(),
  start_at: z.coerce.date(),
  end_at: z.coerce.date().nullable(),  
  total_income: z.number().min(0),
  total_expense: z.number().min(0),
  expected_cash: z.number().min(0).nullable(),
  expected_card: z.number().min(0).nullable().default(null),
})

export type CreateCloseData = z.infer<typeof CreateCloseSchema>
export type FinishCloseData = z.infer<typeof FinishCloseSchema>
export type CloseData = z.infer<typeof CloseSchema>

