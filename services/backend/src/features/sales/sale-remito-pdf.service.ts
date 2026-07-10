import puppeteer, { Browser, LaunchOptions, PDFOptions } from 'puppeteer'
import { SaleRemitoData } from './sale.service.interface'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
})

const pdfOptions: PDFOptions = {
    format: 'A4',
    printBackground: true,
    margin: {
        top: '6mm',
        right: '8mm',
        bottom: '6mm',
        left: '8mm',
    },
}

function formatMoney(value: number | null | undefined): string {
    return currencyFormatter.format(value ?? 0)
}

function formatQuantity(value: number): string {
    return `${value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`
}

function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function saleTotal(data: SaleRemitoData): number {
    return Number((data.sale.amount_meat + data.sale.amount_merchandise).toFixed(2))
}

function customerName(data: SaleRemitoData): string {
    if (!data.customer) {
        return ''
    }

    return `${data.customer.name} ${data.customer.last_name}`.trim()
}

function dateParts(date: Date): { day: string; month: string; year: string } {
    return {
        day: String(date.getDate()).padStart(2, '0'),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        year: String(date.getFullYear()),
    }
}

function renderRows(data: SaleRemitoData): string {
    const detailRows = data.details.map((detail) => `
        <tr>
            <td>${escapeHtml(formatQuantity(detail.weight_kg))}</td>
            <td>${escapeHtml(detail.cut_name)}</td>
            <td class="number">${formatMoney(detail.price_per_kg)}</td>
            <td class="number">${formatMoney(detail.subtotal)}</td>
        </tr>
    `)

    if (data.details.length === 0 && data.sale.amount_meat > 0) {
        detailRows.push(`
            <tr>
                <td>1</td>
                <td>Carne</td>
                <td class="number">${formatMoney(data.sale.amount_meat)}</td>
                <td class="number">${formatMoney(data.sale.amount_meat)}</td>
            </tr>
        `)
    }

    if (data.sale.amount_merchandise > 0) {
        detailRows.push(`
            <tr>
                <td>1</td>
                <td>Mercadería</td>
                <td class="number">${formatMoney(data.sale.amount_merchandise)}</td>
                <td class="number">${formatMoney(data.sale.amount_merchandise)}</td>
            </tr>
        `)
    }

    const emptyRows = Array.from({ length: Math.max(0, 5 - detailRows.length) }, () => `
        <tr class="empty-row">
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
        </tr>
    `)

    return [...detailRows, ...emptyRows].join('')
}

function renderCopy(data: SaleRemitoData): string {
    const parts = dateParts(data.sale.created_at)

    return `
        <section class="remito">
            <header class="remito-header">
                <div class="brand-block">
                    <div class="brand-mark">CR</div>
                    <h1>Carnicería Raúl</h1>
                    <p>Carnes de Primera - Novillos - Pollos</p>
                    <p>Vinos - Gaseosas - Pan</p>
                    <p class="address">Av. Alvear Este 199 - Tel. 02625 42 5493<br />5620 General Alvear - Mendoza</p>
                </div>
                <div class="divider"></div>
                <div class="remito-title">
                    <div class="x-box">X</div>
                    <h2>REMITO INTERNO</h2>
                    <div class="date">
                        <span>FECHA</span>
                        <div class="date-boxes">
                            <div><strong>${parts.day}</strong><small>Día</small></div>
                            <div><strong>${parts.month}</strong><small>Mes</small></div>
                            <div><strong>${parts.year}</strong><small>Año</small></div>
                        </div>
                    </div>
                </div>
            </header>

            <div class="field"><strong>Sr.:</strong><span>${escapeHtml(customerName(data))}</span></div>
            <div class="field"><strong>Domicilio:</strong><span></span></div>

            <table>
                <thead>
                    <tr>
                        <th class="qty">Cant.</th>
                        <th>Detalle</th>
                        <th class="number unit">P. Unit.</th>
                        <th class="number total">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderRows(data)}
                </tbody>
            </table>

            <footer class="remito-footer">
                <strong>DOCUMENTO NO VÁLIDO COMO FACTURA</strong>
                <div class="grand-total">
                    <span>TOTAL $</span>
                    <strong>${formatMoney(saleTotal(data))}</strong>
                </div>
            </footer>
        </section>
    `
}

function renderRemitoHtml(data: SaleRemitoData): string {
    return `
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <title>Remito venta #${data.sale.id}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #4b5563;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            line-height: 1.15;
        }
        .sheet {
            display: flex;
            flex-direction: column;
            gap: 4mm;
            height: 276mm;
        }
        .remito {
            border: 1.5px solid #6b7280;
            display: flex;
            flex-direction: column;
            height: 136mm;
            overflow: hidden;
            padding: 6mm;
        }
        .remito-header {
            align-items: stretch;
            display: grid;
            grid-template-columns: 1fr 1px 1fr;
            gap: 6mm;
            margin-bottom: 5mm;
        }
        .brand-block {
            text-align: center;
        }
        .brand-mark {
            border: 2px solid #6b7280;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-size: 14px;
            font-weight: 800;
            height: 26px;
            margin-bottom: 2mm;
            width: 34px;
        }
        h1, h2, p { margin: 0; }
        h1 {
            color: #5b6472;
            font-size: 15px;
            line-height: 1;
            text-transform: uppercase;
        }
        .address {
            border-top: 1px solid #6b7280;
            margin-top: 1.5mm;
            padding-top: 1.5mm;
        }
        .divider {
            background: #6b7280;
            width: 1px;
        }
        .remito-title {
            text-align: center;
        }
        .x-box {
            border: 2px solid #6b7280;
            display: inline-block;
            font-size: 20px;
            font-weight: 800;
            line-height: 25px;
            margin-right: 2mm;
            width: 28px;
        }
        h2 {
            display: inline-block;
            color: #4b5563;
            font-size: 18px;
            letter-spacing: 1px;
            vertical-align: middle;
        }
        .date {
            margin-top: 5mm;
        }
        .date > span {
            display: block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 4px;
            margin-bottom: 1.5mm;
        }
        .date-boxes {
            display: flex;
            justify-content: center;
            gap: 3mm;
        }
        .date-boxes div {
            text-align: center;
        }
        .date-boxes strong {
            border: 1.5px solid #6b7280;
            border-radius: 6px;
            display: block;
            font-size: 10px;
            min-height: 19px;
            min-width: 29px;
            padding: 3px 5px;
        }
        .date-boxes small {
            display: block;
            margin-top: 1mm;
        }
        .field {
            align-items: flex-end;
            display: grid;
            grid-template-columns: 22mm 1fr;
            gap: 2mm;
            font-size: 12px;
            margin-bottom: 2.5mm;
        }
        .field span {
            border-bottom: 1px dotted #9ca3af;
            min-height: 15px;
        }
        table {
            border-collapse: collapse;
            flex: 0 0 auto;
            width: 100%;
        }
        th {
            border: 1.5px solid #6b7280;
            color: #4b5563;
            font-size: 12px;
            letter-spacing: 2px;
            padding: 3px 5px;
            text-align: left;
        }
        td {
            border-left: 1.5px solid #6b7280;
            border-right: 1.5px solid #6b7280;
            border-bottom: 1px dotted #d1d5db;
            font-size: 10px;
            height: 7mm;
            padding: 3px 5px;
            vertical-align: top;
        }
        tbody tr:last-child td {
            border-bottom: 1.5px solid #6b7280;
        }
        .qty { width: 18mm; }
        .unit { width: 28mm; }
        .total { width: 34mm; }
        .number {
            text-align: right;
            white-space: nowrap;
        }
        .remito-footer {
            align-items: center;
            display: flex;
            justify-content: space-between;
            gap: 6mm;
            margin-top: auto;
            padding-top: 3mm;
        }
        .remito-footer > strong {
            font-size: 11px;
        }
        .grand-total {
            align-items: center;
            display: flex;
            gap: 5mm;
        }
        .grand-total span {
            font-size: 15px;
            font-weight: 800;
        }
        .grand-total strong {
            border: 2px solid #6b7280;
            border-radius: 7px;
            display: inline-block;
            min-width: 34mm;
            padding: 4px 7px;
            text-align: right;
        }
    </style>
</head>
<body>
    <main class="sheet">
        ${renderCopy(data)}
        ${renderCopy(data)}
    </main>
</body>
</html>
`
}

function buildLaunchOptions(): LaunchOptions {
    const options: LaunchOptions = {}

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    }

    if (process.env.PUPPETEER_NO_SANDBOX === 'true') {
        options.args = ['--no-sandbox', '--disable-setuid-sandbox']
    }

    return options
}

export class SaleRemitoPdfService {
    async generateSaleRemitoPdf(data: SaleRemitoData): Promise<Buffer> {
        let browser: Browser | undefined

        try {
            browser = await puppeteer.launch(buildLaunchOptions())
            const page = await browser.newPage()
            await page.setContent(renderRemitoHtml(data), { waitUntil: 'load' })
            const pdf = await page.pdf(pdfOptions)

            return Buffer.from(pdf)
        } finally {
            await browser?.close()
        }
    }
}

export const saleRemitoPdfService = new SaleRemitoPdfService()
