import { z } from 'zod';

export const DebtCreateSchema = z.object({
    sales_id: z.string().min(1, 'Sales ID is required'),
    customer_id: z.string().min(1, 'Customer ID is required'),
    amount: z.number().positive('Amount must be a positive number'),
})

export const UpdateDebtSchema = z.object({
  amount: z.number().positive('amount must be a positive number'),
  status: z.enum(['pending', 'paid', 'partial']),
})

export type DebtCreateData = z.infer<typeof DebtCreateSchema>;
export type UpdateDebtData = z.infer<typeof UpdateDebtSchema>;

