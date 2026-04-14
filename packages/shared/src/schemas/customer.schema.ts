import { z} from 'zod';

export const CreateCustomerSchema = z.object({
    name: z.string().min(3, 'Name is required'),
    last_name: z.string().min(3, 'Last name is required'),
    phone: z.string().min(10, 'Phone number is required').optional(),
    dni: z.string().min(8, 'DNI is required').optional(),
})

export const CustomerSchema = CreateCustomerSchema.extend({
    id: z.number().int().positive(),
    created_at: z.date().or(z.string()),
    deleted_at: z.date().or(z.string()).nullable(),
})

export type CreateCustomerData = z.infer<typeof CreateCustomerSchema>;
export type CustomerData = z.infer<typeof CustomerSchema>;