import { z } from 'zod';

export const CreateExpensesSchema = z.object({
    category: z.string().min(3, 'Category is required'),
    amount: z.number().positive('Amount must be a positive number'),
    description: z.string().optional(),
    close_id: z.number()
})

export const ExpensesSchema = CreateExpensesSchema.extend({

})

export type CreateExpensesData = z.infer<typeof CreateExpensesSchema>;


