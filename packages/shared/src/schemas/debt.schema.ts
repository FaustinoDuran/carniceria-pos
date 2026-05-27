import { z } from 'zod';

export const CreateDebtSchema = z.object({
    sales_id: z.number().int().positive().min(1, 'Sales ID is required'),
    customer_id: z.number().int().positive().min(1, 'Customer ID is required'),
    amount: z.number().positive('Amount must be a positive number'),
})

export const RecordDebtPaymentSchema = z.object({
  paid_amount: z.number().positive('Paid amount must be a positive number'),
  pay_method: z.enum(['cash', 'credit', 'debit', 'transfer']),
})

export const DebtPaymentEventSchema = RecordDebtPaymentSchema.extend({
  id: z.number().int().positive(),
  debt_id: z.number().int().positive().min(1, 'Debt ID is required'),
  close_id: z.number().int().positive().min(1, 'Close ID is required'),
  created_at: z.coerce.date(),
})

export const DebtSchema = CreateDebtSchema.extend({
  id: z.number().int().positive(),
  amount: z.number().min(0, 'Amount must be greater than or equal to 0'),
  status: z.enum(['pending', 'paid', 'partial']),
  pay_method: z.enum(['cash', 'credit', 'debit', 'transfer']).nullable(),
  updated_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
})

export type CreateDebtData = z.infer<typeof CreateDebtSchema>;
export type DebtData = z.infer<typeof DebtSchema>
export type RecordDebtPaymentData = z.infer<typeof RecordDebtPaymentSchema>;
export type DebtPaymentEventData = z.infer<typeof DebtPaymentEventSchema>;

