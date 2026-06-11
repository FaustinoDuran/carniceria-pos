import { z } from 'zod';

export const CreateExpensesSchema = z.object({
    category: z.string().min(3, 'Category is required'),
    amount: z.number().positive('Amount must be a positive number'),
    description: z.string().optional(),
    
})

export const ExpensesSchema = CreateExpensesSchema.extend({
    id: z.number().int().positive().min(1,'ID is required'),
    created_at: z.coerce.date(),
    close_id: z.number().int().positive().nullable(),
})


export const UpdateExpensesSchema = z.object({
    category: z.string().min(3, 'Category is required').optional(),
    amount: z.number().positive('Amount must be a positive number').optional(),
    description: z.string().optional(),
})

export type CreateExpensesData = z.infer<typeof CreateExpensesSchema>;
export type ExpensesData = z.infer<typeof ExpensesSchema>
export type UpdateExpensesData = z.infer<typeof UpdateExpensesSchema>;


