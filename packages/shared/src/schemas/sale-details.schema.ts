import { z } from 'zod'

export const CreateSaleDetailSchema = z.object({
    cut_name: z.string().min(1).max(100),
    price_per_kg: z.number().min(0),
    weight_kg: z.number().min(0),
})

export const SaleDetailSchema = CreateSaleDetailSchema.extend({
    id: z.number().int().positive(),
    sale_id: z.number().int().positive(),
    subtotal: z.number().min(0),
    created_at: z.coerce.date(),
})

export type CreateSaleDetailData = z.infer<typeof CreateSaleDetailSchema>
export type SaleDetailData = z.infer<typeof SaleDetailSchema>
