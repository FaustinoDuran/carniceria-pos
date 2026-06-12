import { Request, Response } from 'express'
import { closeService } from './close.service'
import { closeReportPdfService } from './close-report-pdf.service'
import { CloseFilters, FinishCloseInput } from './close.service.interface'
import { serializeResource } from '../../http/utils/serialize'

export const closeController = {
    async start(req: Request, res: Response): Promise<void> {
        const close = await closeService.start()
        res.status(201).json(serializeResource(close))
    },

    async search(req: Request, res: Response): Promise<void> {
        const query = res.locals.query as { start_at?: Date; end_at?: Date | 'open' }
        const filters: CloseFilters = {}

        if (query.start_at !== undefined) {
            filters.start_at = query.start_at
        }

        if (query.end_at !== undefined) {
            filters.end_at = query.end_at === 'open' ? null : query.end_at
        }

        const closes = await closeService.search(Object.keys(filters).length ? filters : undefined)
        res.json(serializeResource(closes))
    },

    async getActive(req: Request, res: Response): Promise<void> {
        const close = await closeService.getActive()
        res.json(serializeResource(close))
    },

    async getById(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const close = await closeService.getById(id)
        res.json(serializeResource(close))
    },

    async finish(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const body = res.locals.body as FinishCloseInput
        const close = await closeService.finish(id, body)
        res.json(serializeResource(close))
    },

    async getReport(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const report = await closeService.getReportData(id)
        res.json(serializeResource(report))
    },

    async downloadPDF(req: Request, res: Response): Promise<void> {
        const { id } = res.locals.params as { id: number }
        const report = await closeService.getReportData(id)
        const pdf = await closeReportPdfService.generateCloseReportPdf(report)

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="cierre-${id}.pdf"`)
        res.send(pdf)
    },
}
