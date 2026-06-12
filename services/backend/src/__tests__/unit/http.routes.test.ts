import request from 'supertest'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { app } from '../../app'
import { customerService } from '../../features/customers/customer.service'
import { closeService } from '../../features/closes/close.service'
import { closeReportPdfService } from '../../features/closes/close-report-pdf.service'
import { expenseService } from '../../features/expenses/expense.service'
import { saleService } from '../../features/sales/sale.service'
import { saleRemitoPdfService } from '../../features/sales/sale-remito-pdf.service'
import { debtService } from '../../features/debts/debt.service'
import { BusinessError, NotFoundError } from '../../shared/errors'
import {
    createMockCloseFinished,
    createMockCloseOpening,
    createMockCustomer,
    createMockDebt,
    createMockDebtPaymentEvent,
    createMockExpense,
    createMockSale,
    createMockSaleDetail,
    mockCloseReportData,
} from './mocks'

vi.mock('../../features/customers/customer.service', () => ({
    customerService: {
        search: vi.fn(),
        getById: vi.fn(),
        register: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        restore: vi.fn(),
    },
}))

vi.mock('../../features/closes/close.service', () => ({
    closeService: {
        start: vi.fn(),
        search: vi.fn(),
        getActive: vi.fn(),
        getById: vi.fn(),
        finish: vi.fn(),
        getReportData: vi.fn(),
    },
}))

vi.mock('../../features/closes/close-report-pdf.service', () => ({
    closeReportPdfService: {
        generateCloseReportPdf: vi.fn(),
    },
}))

vi.mock('../../features/expenses/expense.service', () => ({
    expenseService: {
        search: vi.fn(),
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}))

vi.mock('../../features/sales/sale.service', () => ({
    saleService: {
        search: vi.fn(),
        getById: vi.fn(),
        getDetails: vi.fn(),
        getRemitoData: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}))

vi.mock('../../features/sales/sale-remito-pdf.service', () => ({
    saleRemitoPdfService: {
        generateSaleRemitoPdf: vi.fn(),
    },
}))

vi.mock('../../features/debts/debt.service', () => ({
    debtService: {
        search: vi.fn(),
        getById: vi.fn(),
        recordPayment: vi.fn(),
        getPaymentEvents: vi.fn(),
    },
}))

describe('HTTP routes and middlewares', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns health status and request id header', async () => {
        const response = await request(app).get('/health').expect(200)

        expect(response.body).toEqual({ status: 'ok' })
        expect(response.headers['x-request-id']).toBeTruthy()
    })

    it('allows Vite dev origin through CORS', async () => {
        const response = await request(app)
            .get('/health')
            .set('Origin', 'http://localhost:5173')
            .expect(200)

        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    })

    it('returns uniform 404 for unknown routes', async () => {
        const response = await request(app)
            .get('/api/unknown')
            .set('X-Request-Id', 'test-request-id')
            .expect(404)

        expect(response.body).toEqual({
            error: {
                code: 'NOT_FOUND',
                message: 'Route GET /api/unknown not found',
                requestId: 'test-request-id',
            },
        })
    })

    it('validates params and returns 400 with details', async () => {
        const response = await request(app).get('/api/customers/not-a-number').expect(400)

        expect(response.body.error.code).toBe('VALIDATION_ERROR')
        expect(response.body.error.details[0].path).toBe('id')
        expect(customerService.getById).not.toHaveBeenCalled()
    })

    it('maps NotFoundError to 404', async () => {
        ;(customerService.getById as Mock).mockRejectedValue(new NotFoundError('Customer not found'))

        const response = await request(app).get('/api/customers/99').expect(404)

        expect(response.body.error).toMatchObject({
            code: 'NOT_FOUND',
            message: 'Customer not found',
        })
    })

    it('maps database relation errors to safe business errors', async () => {
        ;(customerService.getById as Mock).mockRejectedValue({
            code: '23503',
            message: 'update or delete on table "sales" violates foreign key constraint',
        })

        const response = await request(app).get('/api/customers/1').expect(409)

        expect(response.body.error).toMatchObject({
            code: 'BUSINESS_ERROR',
            message: 'Operation cannot be completed because related records exist',
        })
    })

    it('serializes model getters without private fields', async () => {
        ;(customerService.search as Mock).mockResolvedValue([
            createMockCustomer({ id: 7, name: 'Ana', last_name: 'Lopez' }),
        ])

        const response = await request(app).get('/api/customers?name=Ana').expect(200)

        expect(customerService.search).toHaveBeenCalledWith({ name: 'Ana' })
        expect(response.body).toEqual([
            expect.objectContaining({
                id: 7,
                name: 'Ana',
                last_name: 'Lopez',
                deleted_at: null,
            }),
        ])
        expect(response.body[0]._id).toBeUndefined()
    })

    it('searches deleted customers by dni', async () => {
        ;(customerService.search as Mock).mockResolvedValue([
            createMockCustomer({ id: 9, dni: '30111222', deleted_at: new Date() }),
        ])

        await request(app).get('/api/customers/deleted?dni=30111222').expect(200)

        expect(customerService.search).toHaveBeenCalledWith({ dni: '30111222', deleted: true })
    })

    it('creates customers with validated body', async () => {
        const customer = createMockCustomer({ id: 8, name: 'Luis', last_name: 'Perez' })
        ;(customerService.register as Mock).mockResolvedValue(customer)

        const body = {
            name: 'Luis',
            last_name: 'Perez',
            phone: '1234567890',
            dni: '12345678',
        }

        const response = await request(app).post('/api/customers').send(body).expect(201)

        expect(customerService.register).toHaveBeenCalledWith(body)
        expect(response.body.id).toBe(8)
    })

    it('updates customers with validated body', async () => {
        const customer = createMockCustomer({ id: 8, name: 'Luis', last_name: 'Perez' })
        ;(customerService.update as Mock).mockResolvedValue(customer)

        const body = {
            name: 'Luis',
            last_name: 'Perez',
        }

        const response = await request(app).put('/api/customers/8').send(body).expect(200)

        expect(customerService.update).toHaveBeenCalledWith(8, body)
        expect(response.body.id).toBe(8)
    })

    it('deletes customers with 204', async () => {
        ;(customerService.delete as Mock).mockResolvedValue(undefined)

        await request(app).delete('/api/customers/1').expect(204)

        expect(customerService.delete).toHaveBeenCalledWith(1)
    })

    it('starts closes manually', async () => {
        const close = createMockCloseOpening({ id: 3 })
        ;(closeService.start as Mock).mockResolvedValue(close)

        const response = await request(app).post('/api/closes/start').expect(201)

        expect(closeService.start).toHaveBeenCalledTimes(1)
        expect(response.body.id).toBe(3)
        expect(response.body.end_at).toBeNull()
    })

    it('searches open closes through end_at=open', async () => {
        ;(closeService.search as Mock).mockResolvedValue([createMockCloseOpening()])

        await request(app).get('/api/closes?end_at=open').expect(200)

        expect(closeService.search).toHaveBeenCalledWith({ end_at: null })
    })

    it('finishes closes with expected cash only', async () => {
        const close = createMockCloseFinished({ id: 4, expected_cash: 500 })
        ;(closeService.finish as Mock).mockResolvedValue(close)

        const response = await request(app)
            .post('/api/closes/4/finish')
            .send({ expected_cash: 500 })
            .expect(200)

        expect(closeService.finish).toHaveBeenCalledWith(4, { expected_cash: 500 })
        expect(response.body.expected_cash).toBe(500)
    })

    it('returns JSON close reports and downloads PDF reports', async () => {
        ;(closeService.getReportData as Mock).mockResolvedValue(mockCloseReportData)
        ;(closeReportPdfService.generateCloseReportPdf as Mock).mockResolvedValue(Buffer.from('%PDF-test'))

        const report = await request(app).get('/api/closes/1/report').expect(200)
        const pdf = await request(app).get('/api/closes/1/report/pdf').expect(200)

        expect(report.body.summary.totalSales).toBe(1600)
        expect(closeService.getReportData).toHaveBeenCalledWith(1)
        expect(closeReportPdfService.generateCloseReportPdf).toHaveBeenCalledWith(mockCloseReportData)
        expect(pdf.headers['content-type']).toContain('application/pdf')
        expect(pdf.headers['content-disposition']).toBe('attachment; filename="cierre-1.pdf"')
    })

    it('searches expenses with supported filters only', async () => {
        ;(expenseService.search as Mock).mockResolvedValue([createMockExpense({ id: 5 })])

        await request(app).get('/api/expenses?close_id=2&date=2026-06-10').expect(200)

        expect(expenseService.search).toHaveBeenCalledWith({
            close_id: 2,
            date: new Date('2026-06-10'),
        })
    })

    it('searches open expenses through close_id=null', async () => {
        ;(expenseService.search as Mock).mockResolvedValue([createMockExpense({ id: 5, close_id: null })])

        await request(app).get('/api/expenses?close_id=null').expect(200)

        expect(expenseService.search).toHaveBeenCalledWith({
            close_id: null,
            date: undefined,
        })
    })

    it('creates expenses and maps business errors to 409', async () => {
        ;(expenseService.create as Mock).mockRejectedValue(
            new BusinessError('Cannot create expense without an active close'),
        )

        const response = await request(app)
            .post('/api/expenses')
            .send({ category: 'supplies', amount: 100 })
            .expect(409)

        expect(response.body.error.code).toBe('BUSINESS_ERROR')
    })

    it('validates cc sale customer_id at request boundary', async () => {
        await request(app)
            .post('/api/sales')
            .send({ amount_meat: 100, amount_merchandise: 0, pay_method: 'cc' })
            .expect(400)

        expect(saleService.create).not.toHaveBeenCalled()
    })

    it('creates sales with details and customer id', async () => {
        const sale = createMockSale({ id: 11, pay_method: 'cc' })
        ;(saleService.create as Mock).mockResolvedValue(sale)

        await request(app)
            .post('/api/sales')
            .send({
                amount_meat: 0,
                amount_merchandise: 50,
                pay_method: 'cc',
                customer_id: 1,
                details: [{ cut_name: 'Asado', price_per_kg: 10, weight_kg: 2 }],
            })
            .expect(201)

        expect(saleService.create).toHaveBeenCalledWith(
            { amount_meat: 0, amount_merchandise: 50, pay_method: 'cc' },
            [{ cut_name: 'Asado', price_per_kg: 10, weight_kg: 2 }],
            1,
        )
    })

    it('searches today open sales and returns sale details', async () => {
        ;(saleService.search as Mock).mockResolvedValue([createMockSale({ id: 12 })])
        ;(saleService.getDetails as Mock).mockResolvedValue([
            createMockSaleDetail({ sale_id: 12, cut_name: 'Vacio' }),
        ])

        await request(app).get('/api/sales?date=today&close_id=null').expect(200)
        const detailsResponse = await request(app).get('/api/sales/12/details').expect(200)

        expect(saleService.search).toHaveBeenCalledWith({
            date: expect.any(Date),
            close_id: null,
            pay_method: undefined,
        })
        expect(saleService.getDetails).toHaveBeenCalledWith(12)
        expect(detailsResponse.body[0].cut_name).toBe('Vacio')
    })

    it('downloads sale remito PDFs', async () => {
        const remitoData = {
            sale: createMockSale({ id: 12, amount_meat: 2000, amount_merchandise: 0 }),
            details: [createMockSaleDetail({ sale_id: 12 })],
            customer: createMockCustomer({ id: 1, name: 'Ana', last_name: 'Lopez' }),
        }
        ;(saleService.getRemitoData as Mock).mockResolvedValue(remitoData)
        ;(saleRemitoPdfService.generateSaleRemitoPdf as Mock).mockResolvedValue(Buffer.from('%PDF-remito'))

        const response = await request(app).get('/api/sales/12/remito/pdf').expect(200)

        expect(saleService.getRemitoData).toHaveBeenCalledWith(12)
        expect(saleRemitoPdfService.generateSaleRemitoPdf).toHaveBeenCalledWith(remitoData)
        expect(response.headers['content-type']).toContain('application/pdf')
        expect(response.headers['content-disposition']).toBe('attachment; filename="remito-venta-12.pdf"')
    })

    it('returns 409 when sale remito has no details', async () => {
        ;(saleService.getRemitoData as Mock).mockRejectedValue(
            new BusinessError('El remito solo se puede imprimir para ventas con detalle de cortes'),
        )

        const response = await request(app).get('/api/sales/12/remito/pdf').expect(409)

        expect(response.body.error.message).toBe('El remito solo se puede imprimir para ventas con detalle de cortes')
        expect(saleRemitoPdfService.generateSaleRemitoPdf).not.toHaveBeenCalled()
    })

    it('records debt payments against the active close', async () => {
        ;(debtService.getById as Mock).mockResolvedValue(createMockDebt({ id: 1 }))
        ;(closeService.getActive as Mock).mockResolvedValue(createMockCloseOpening({ id: 3 }))
        ;(debtService.recordPayment as Mock).mockResolvedValue(createMockDebtPaymentEvent({ close_id: 3 }))

        const response = await request(app)
            .post('/api/debts/1/payments')
            .send({ paid_amount: 100, pay_method: 'cash' })
            .expect(201)

        expect(debtService.recordPayment).toHaveBeenCalledWith(1, 3, {
            paid_amount: 100,
            pay_method: 'cash',
        })
        expect(response.body.close_id).toBe(3)
    })

    it('rejects debt payments when there is no active close', async () => {
        ;(debtService.getById as Mock).mockResolvedValue(createMockDebt({ id: 1 }))
        ;(closeService.getActive as Mock).mockResolvedValue(null)

        const response = await request(app)
            .post('/api/debts/1/payments')
            .send({ paid_amount: 100, pay_method: 'cash' })
            .expect(409)

        expect(response.body.error.message).toBe('Cannot record debt payment without an active close')
        expect(debtService.recordPayment).not.toHaveBeenCalled()
    })
})
