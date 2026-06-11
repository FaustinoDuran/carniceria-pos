import { z } from 'zod';

export const CreateSalesSchema = z.object({
    amount_meat: z.number().min(0).default(0),
    amount_merchandise: z.number().min(0).default(0),
    pay_method: z.enum(['cash', 'credit', 'cc', 'debit', 'transfer']),
})

export const SalesSchema = CreateSalesSchema.extend({
    id: z.number().int().positive(),
    close_id: z.number().int().positive().nullable(),
    created_at: z.coerce.date(),
})

export const UpdateSalesSchema = z.object({
    amount_meat: z.number().min(0).optional(),
    amount_merchandise: z.number().min(0).optional(),
    pay_method: z.enum(['cash', 'credit', 'cc', 'debit', 'transfer']).optional(),
})

export type CreateSalesData = z.infer<typeof CreateSalesSchema>;
export type SalesData = z.infer<typeof SalesSchema>;
export type UpdateSalesData = z.infer<typeof UpdateSalesSchema>;