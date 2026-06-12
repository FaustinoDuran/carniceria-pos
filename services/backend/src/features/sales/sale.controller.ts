import { Request, Response } from 'express'
import { CreateSalesData, UpdateSalesData } from '@carniceria/shared'
import { saleService } from './sale.service'
import { saleRemitoPdfService } from './sale-remito-pdf.service'
import { SaleDetailInput } from './sale.service.interface'
import { SaleFilters } from './types'
import { serializeResource } from '../../http/utils/serialize'

interface SaleRequestBody extends CreateSalesData {
    details?: SaleDetailInput[]
    customer_id?: number
}

interface UpdateSaleRequestBody extends UpdateSalesData {
    details?: SaleDetailInput[]
    customer_id?: number
}

export const saleController = {
    async search(req: Request, res: Response): Promise<void> {
        const query = res.locals.query as { date?: Date | 'today'; close_id?: number | 'null'; pay_method?: SaleFilters['pay_method'] }
        const filters: SaleFilters = {
            pay_method: query.pay_method,
            date: query.date === 'today' ? new Date() : query.date,
            close_id: query.close_id === 'null' ? null : query.close_id,
        }
        const sales = await saleService.search(filters)
        res.json(serializeResource(sales))
    },

    async getById(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const sale = await saleService.getById(id)
        res.json(serializeResource(sale))
    },

    async getDetails(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const details = await saleService.getDetails(id)
        res.json(serializeResource(details))
    },

    async create(req: Request, res: Response): Promise<void> {
        const { details, customer_id, ...saleData } = res.locals.body as SaleRequestBody
        const sale = await saleService.create(saleData as CreateSalesData, details, customer_id)
        res.status(201).json(serializeResource(sale))
    },

    async update(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const { details, customer_id, ...saleData } = res.locals.body as UpdateSaleRequestBody
        const sale = await saleService.update(id, saleData as UpdateSalesData, details, customer_id)
        res.json(serializeResource(sale))
    },

    async delete(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        await saleService.delete(id)
        res.status(204).send()
    },

    async downloadRemitoPDF(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const remitoData = await saleService.getRemitoData(id)
        const pdf = await saleRemitoPdfService.generateSaleRemitoPdf(remitoData)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="remito-venta-${id}.pdf"`)
        res.send(pdf)
    },
}
