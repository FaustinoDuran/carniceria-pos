import puppeteer from 'puppeteer'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { closeReportPdfService } from '../../features/closes/close-report-pdf.service'
import { createMockExpense, mockCloseReportData } from './mocks'

vi.mock('puppeteer', () => ({
    default: {
        launch: vi.fn(),
    },
}))

describe('CloseReportPdfService', () => {
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

    it('generates a close report PDF from HTML and closes the browser', async () => {
        const result = await closeReportPdfService.generateCloseReportPdf(mockCloseReportData)
        const [html, setContentOptions] = page.setContent.mock.calls[0]

        expect(puppeteer.launch).toHaveBeenCalledWith({})
        expect(browser.newPage).toHaveBeenCalledTimes(1)
        expect(html).toContain('Carniceria POS')
        expect(html).toContain('Reporte de cierre de caja')
        expect(html).toContain(`Cierre #${mockCloseReportData.close.id}`)
        expect(html).toContain('Total ventas')
        expect(html).toContain('Ventas')
        expect(html).toContain('Carne')
        expect(html).toContain('Mercaderia')
        expect(html).toContain('Gastos')
        expect(html).toContain('Deudas generadas')
        expect(html).toContain('Pagos de deuda')
        expect(html).toContain('Subtotal ventas')
        expect(html).toContain('Subtotal carne')
        expect(html).toContain('Subtotal mercaderia')
        expect(html).toContain('Subtotal gastos')
        expect(html).toContain('Subtotal deudas generadas')
        expect(html).toContain('Subtotal deudas cobradas')
        expect(html).toContain('Nro. deuda')
        expect(html).toContain('Juan Perez')
        expect(setContentOptions).toEqual({ waitUntil: 'load' })
        expect(page.pdf).toHaveBeenCalledWith({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '16mm',
                right: '14mm',
                bottom: '16mm',
                left: '14mm',
            },
        })
        expect(Buffer.isBuffer(result)).toBe(true)
        expect(result).toEqual(Buffer.from(pdfBytes))
        expect(browser.close).toHaveBeenCalledTimes(1)
    })

    it('closes the browser when PDF generation fails', async () => {
        const error = new Error('PDF failed')
        page.pdf.mockRejectedValue(error)

        await expect(closeReportPdfService.generateCloseReportPdf(mockCloseReportData)).rejects.toThrow(error)

        expect(browser.close).toHaveBeenCalledTimes(1)
    })

    it('escapes dynamic text before rendering the report HTML', async () => {
        const report = {
            ...mockCloseReportData,
            expenses: [
                createMockExpense({
                    category: '<script>alert(1)</script>',
                    description: 'Gasto "especial" & urgente',
                }),
            ],
        }

        await closeReportPdfService.generateCloseReportPdf(report)

        const html = page.setContent.mock.calls[0][0] as string
        expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
        expect(html).toContain('Gasto &quot;especial&quot; &amp; urgente')
        expect(html).not.toContain('<script>alert(1)</script>')
    })
})
