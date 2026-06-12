import puppeteer from 'puppeteer'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { saleRemitoPdfService } from '../../features/sales/sale-remito-pdf.service'
import { createMockCustomer, createMockSale, createMockSaleDetail } from './mocks'

vi.mock('puppeteer', () => ({
    default: {
        launch: vi.fn(),
    },
}))

describe('SaleRemitoPdfService', () => {
    const pdfBytes = new Uint8Array([37, 80, 68, 70])
    const page = {
        setContent: vi.fn(),
        pdf: vi.fn(),
    }
    const browser = {
        newPage: vi.fn(),
        close: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        page.setContent.mockResolvedValue(undefined)
        page.pdf.mockResolvedValue(pdfBytes)
        browser.newPage.mockResolvedValue(page)
        browser.close.mockResolvedValue(undefined)
        ;(puppeteer.launch as Mock).mockResolvedValue(browser)
    })

    it('generates a two-copy sale remito PDF from HTML and closes the browser', async () => {
        const result = await saleRemitoPdfService.generateSaleRemitoPdf({
            sale: createMockSale({ id: 3, amount_meat: 2000, amount_merchandise: 500, created_at: new Date('2026-06-11T12:00:00Z') }),
            details: [createMockSaleDetail({ cut_name: 'Asado', price_per_kg: 1000, weight_kg: 2, subtotal: 2000 })],
            customer: createMockCustomer({ id: 9, name: 'Ana', last_name: 'Lopez' }),
        })
        const [html, setContentOptions] = page.setContent.mock.calls[0]

        expect(puppeteer.launch).toHaveBeenCalledWith({})
        expect(browser.newPage).toHaveBeenCalledTimes(1)
        expect(html).toContain('REMITO INTERNO')
        expect(html).toContain('Carnicería Raúl')
        expect(html).toContain('Ana Lopez')
        expect(html).toContain('Asado')
        expect(html).toContain('Mercadería')
        expect(html.match(/REMITO INTERNO/g)).toHaveLength(2)
        expect(setContentOptions).toEqual({ waitUntil: 'load' })
        expect(page.pdf).toHaveBeenCalledWith({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '6mm',
                right: '8mm',
                bottom: '6mm',
                left: '8mm',
            },
        })
        expect(Buffer.isBuffer(result)).toBe(true)
        expect(result).toEqual(Buffer.from(pdfBytes))
        expect(browser.close).toHaveBeenCalledTimes(1)
    })

    it('renders an empty customer field when no customer is associated', async () => {
        await saleRemitoPdfService.generateSaleRemitoPdf({
            sale: createMockSale({ id: 3, amount_meat: 2000, amount_merchandise: 0 }),
            details: [createMockSaleDetail({ cut_name: 'Vacio', price_per_kg: 1000, weight_kg: 2, subtotal: 2000 })],
            customer: null,
        })

        const html = page.setContent.mock.calls[0][0] as string
        expect(html).toContain('<strong>Sr.:</strong><span></span>')
    })

    it('closes the browser when PDF generation fails', async () => {
        const error = new Error('PDF failed')
        page.pdf.mockRejectedValue(error)

        await expect(saleRemitoPdfService.generateSaleRemitoPdf({
            sale: createMockSale({ id: 3, amount_meat: 2000, amount_merchandise: 0 }),
            details: [createMockSaleDetail()],
            customer: null,
        })).rejects.toThrow(error)

        expect(browser.close).toHaveBeenCalledTimes(1)
    })
})
