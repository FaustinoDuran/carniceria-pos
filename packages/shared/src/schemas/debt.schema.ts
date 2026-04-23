import { z } from 'zod';

export const CreateDebtSchema = z.object({
    sales_id: z.number().int().positive().min(1, 'Sales ID is required'),
    customer_id: z.number().int().positive().min(1, 'Customer ID is required'),
    amount: z.number().positive('Amount must be a positive number'),
})

export const DebtUpdateSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  status: z.enum(['pending', 'paid', 'partial']),
})

export const DebtSchema = CreateDebtSchema.extend({
  id: z.number().int().positive(),
  status: z.enum(['pending', 'paid', 'partial']),
  created_at: z.coerce.date(),
})

export type CreateDebtData = z.infer<typeof CreateDebtSchema>;
export type DebtData = z.infer<typeof DebtSchema>
export type DebtUpdateData = z.infer<typeof DebtUpdateSchema>;

