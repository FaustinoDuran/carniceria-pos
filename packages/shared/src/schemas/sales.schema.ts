import { z } from 'zod';

export const SalesCreateSchema = z.object({
    mount_meat: z.number().min(0).default(0),
    amount_merchandise: z.number().min(0).default(0),
    pay_method: z.enum(['cash', 'credit', 'cc', 'debit', 'transfer']),
})

export type SalesCreateData = z.infer<typeof SalesCreateSchema>;