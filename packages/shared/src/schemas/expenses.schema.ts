import { z } from 'zod';

export const ExpensesCreateSchema = z.object({
    category: z.string().min(3, 'Category is required'),
    amount: z.number().positive('Amount must be a positive number'),
    description: z.string().optional(),
})

export type ExpensesCreateData = z.infer<typeof ExpensesCreateSchema>;


