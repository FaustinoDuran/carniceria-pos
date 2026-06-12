import { z} from 'zod';

export const CreateCustomerSchema = z.object({
    name: z.string().min(3, 'Name is required'),
    last_name: z.string().min(3, 'Last name is required'),
    phone: z.string().min(10, 'Phone number is required').optional(),
    dni: z.string().min(8, 'DNI is required').optional(),
})

export const UpdateCustomerSchema = z.object({
    name: z.string().min(3, 'Name is required').optional(),
    last_name: z.string().min(3, 'Last name is required').optional(),
    phone: z.string().min(10, 'Phone number is required').optional(),
    dni: z.string().min(8, 'DNI is required').optional(),
})

export const CustomerSchema = CreateCustomerSchema.extend({
    id: z.number().int().positive(),
    created_at: z.coerce.date(),
    deleted_at: z.coerce.date().nullable(),
})

export type CreateCustomerData = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerData = z.infer<typeof UpdateCustomerSchema>;
export type CustomerData = z.infer<typeof CustomerSchema>;
