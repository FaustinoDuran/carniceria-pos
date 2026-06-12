import { z } from 'zod'
import { CreateSaleDetailSchema, CreateSalesSchema, UpdateSalesSchema } from '@carniceria/shared'

export const CreateSaleFormSchema = CreateSalesSchema.extend({
  customer_id: z.coerce.number().int().positive().optional(),
  details: z.array(CreateSaleDetailSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.pay_method === 'cc' && !data.customer_id) {
    ctx.addIssue({ code: 'custom', path: ['customer_id'], message: 'Seleccioná un cliente' })
  }
})

export const UpdateSaleFormSchema = UpdateSalesSchema.extend({
  customer_id: z.coerce.number().int().positive().optional(),
  details: z.array(CreateSaleDetailSchema).optional(),
})

export type CreateSaleFormData = z.infer<typeof CreateSaleFormSchema>
export type UpdateSaleFormData = z.infer<typeof UpdateSaleFormSchema>
