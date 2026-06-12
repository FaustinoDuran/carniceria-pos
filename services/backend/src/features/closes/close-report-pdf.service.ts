import puppeteer, { Browser, LaunchOptions, PDFOptions } from 'puppeteer'
import { CloseReportData } from './types'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
})

const pdfOptions: PDFOptions = {
    format: 'A4',
    printBackground: true,
    margin: {
        top: '16mm',
        right: '14mm',
        bottom: '16mm',
        left: '14mm',
    },
}

function formatMoney(value: number | null | undefined): string {
    return currencyFormatter.format(value ?? 0)
}

function formatDate(value: Date | null | undefined): string {
    return value ? dateTimeFormatter.format(value) : '-'
}

function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function paymentLabel(payMethod: string): string {
    const labels: Record<string, string> = {
        cash: 'Efectivo',
        credit: 'Credito',
        debit: 'Debito',
        transfer: 'Transferencia',
        cc: 'Cuenta corriente',
    }

    return labels[payMethod] ?? payMethod
}

function emptyRow(columns: number, message: string): string {
    return `<tr><td colspan="${columns}" class="empty">${escapeHtml(message)}</td></tr>`
}

function renderSummary(report: CloseReportData): string {
    const { summary } = report

    const rows = [
        ['Total ventas', summary.totalSales],
        ['Ventas efectivo', summary.totalCash],
        ['Ventas transferencia', summary.totalTransfer],
        ['Ventas tarjeta', summary.totalCard],
        ['Cuenta corriente generada', summary.totalDebtGenerated],
        ['Deudas cobradas', summary.totalDebtPaid],
        ['Gastos', summary.totalExpenses],
        ['Ingreso real', summary.realIncome],
        ['Efectivo esperado', summary.expectedCash],
    ]

    return rows.map(([label, value]) => `
        <div class="summary-item">
            <span>${escapeHtml(label)}</span>
            <strong>${formatMoney(value as number | null)}</strong>
        </div>
    `).join('')
}

function renderSales(report: CloseReportData): string {
    const rows = report.sales.all.map((sale) => {
        const total = sale.amount_meat + sale.amount_merchandise

        return `
            <tr>
                <td>#${sale.id}</td>
                <td>${formatDate(sale.created_at)}</td>
                <td>${escapeHtml(paymentLabel(sale.pay_method))}</td>
                <td class="number">${formatMoney(sale.amount_meat)}</td>
                <td class="number">${formatMoney(sale.amount_merchandise)}</td>
                <td class="number">${formatMoney(total)}</td>
            </tr>
        `
    }).join('')

    return rows || emptyRow(6, 'Sin ventas registradas')
}

function renderSalesSubtotal(report: CloseReportData): string {
    const { summary } = report

    return `
        <tfoot>
            <tr class="subtotal">
                <td colspan="3">Subtotal ventas</td>
                <td class="number">${formatMoney(summary.totalMeat)}</td>
                <td class="number">${formatMoney(summary.totalMerchandise)}</td>
                <td class="number">${formatMoney(summary.totalSales)}</td>
            </tr>
        </tfoot>
    `
}

function renderMeatSales(report: CloseReportData): string {
    const rows = report.sales.all
        .filter((sale) => sale.amount_meat > 0)
        .map((sale) => `
            <tr>
                <td>#${sale.id}</td>
                <td>${formatDate(sale.created_at)}</td>
                <td>${escapeHtml(paymentLabel(sale.pay_method))}</td>
                <td class="number">${formatMoney(sale.amount_meat)}</td>
            </tr>
        `).join('')

    return rows || emptyRow(4, 'Sin ventas de carne registradas')
}

function renderMeatSalesSubtotal(report: CloseReportData): string {
    return `
        <tfoot>
            <tr class="subtotal">
                <td colspan="3">Subtotal carne</td>
                <td class="number">${formatMoney(report.summary.totalMeat)}</td>
            </tr>
        </tfoot>
    `
}

function renderMerchandiseSales(report: CloseReportData): string {
    const rows = report.sales.all
        .filter((sale) => sale.amount_merchandise > 0)
        .map((sale) => `
            <tr>
                <td>#${sale.id}</td>
                <td>${formatDate(sale.created_at)}</td>
                <td>${escapeHtml(paymentLabel(sale.pay_method))}</td>
                <td class="number">${formatMoney(sale.amount_merchandise)}</td>
            </tr>
        `).join('')

    return rows || emptyRow(4, 'Sin ventas de mercaderia registradas')
}

function renderMerchandiseSalesSubtotal(report: CloseReportData): string {
    return `
        <tfoot>
            <tr class="subtotal">
                <td colspan="3">Subtotal mercaderia</td>
                <td class="number">${formatMoney(report.summary.totalMerchandise)}</td>
            </tr>
        </tfoot>
    `
}

function renderExpenses(report: CloseReportData): string {
    const rows = report.expenses.map((expense) => `
        <tr>
            <td>#${expense.id}</td>
            <td>${formatDate(expense.created_at)}</td>
            <td>${escapeHtml(expense.category)}</td>
            <td>${escapeHtml(expense.description || '-')}</td>
            <td class="number">${formatMoney(expense.amount)}</td>
        </tr>
    `).join('')

    return rows || emptyRow(5, 'Sin gastos registrados')
}

function renderExpensesSubtotal(report: CloseReportData): string {
    return `
        <tfoot>
            <tr class="subtotal">
                <td colspan="4">Subtotal gastos</td>
                <td class="number">${formatMoney(report.summary.totalExpenses)}</td>
            </tr>
        </tfoot>
    `
}

function renderGeneratedDebts(report: CloseReportData): string {
    const rows = report.debts.generated.map((debt) => `
        <tr>
            <td>#${debt.id}</td>
            <td>${formatDate(debt.created_at)}</td>
            <td>#${debt.sales_id}</td>
            <td>${escapeHtml(debt.customer_name)} <span class="muted">#${debt.customer_id}</span></td>
            <td>${escapeHtml(debt.status)}</td>
            <td class="number">${formatMoney(debt.amount)}</td>
        </tr>
    `).join('')

    return rows || emptyRow(6, 'Sin deudas generadas')
}

function renderGeneratedDebtsSubtotal(report: CloseReportData): string {
    return `
        <tfoot>
            <tr class="subtotal">
                <td colspan="5">Subtotal deudas generadas</td>
                <td class="number">${formatMoney(report.summary.totalDebtGenerated)}</td>
            </tr>
        </tfoot>
    `
}

function renderPaidDebts(report: CloseReportData): string {
    const rows = report.debts.paid.map((payment) => `
        <tr>
            <td>#${payment.id}</td>
            <td>${formatDate(payment.created_at)}</td>
            <td>#${payment.debt_id}</td>
            <td>${escapeHtml(payment.customer_name)} <span class="muted">#${payment.customer_id}</span></td>
            <td>${escapeHtml(paymentLabel(payment.pay_method))}</td>
            <td class="number">${formatMoney(payment.paid_amount)}</td>
        </tr>
    `).join('')

    return rows || emptyRow(6, 'Sin pagos de deuda registrados')
}

function renderPaidDebtsSubtotal(report: CloseReportData): string {
    return `
        <tfoot>
            <tr class="subtotal">
                <td colspan="5">Subtotal deudas cobradas</td>
                <td class="number">${formatMoney(report.summary.totalDebtPaid)}</td>
            </tr>
        </tfoot>
    `
}

function renderCloseReportHtml(report: CloseReportData): string {
    const { close, summary } = report

    return `
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <title>Reporte de cierre #${close.id}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #1f2933;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.35;
        }
        h1, h2, p { margin: 0; }
        .header {
            border-bottom: 2px solid #1f2933;
            display: flex;
            justify-content: space-between;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }
        .brand {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0;
        }
        .subtitle {
            color: #52606d;
            margin-top: 4px;
        }
        .meta {
            text-align: right;
            color: #323f4b;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 18px;
        }
        .summary-item {
            border: 1px solid #d9e2ec;
            border-radius: 4px;
            padding: 8px;
        }
        .summary-item span {
            color: #52606d;
            display: block;
            font-size: 10px;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .summary-item strong {
            display: block;
            font-size: 14px;
        }
        .highlight {
            background: #f0f4f8;
            border: 1px solid #bcccdc;
            margin-bottom: 18px;
            padding: 10px;
        }
        .section {
            margin-top: 18px;
            page-break-inside: avoid;
        }
        .section h2 {
            border-bottom: 1px solid #d9e2ec;
            font-size: 15px;
            margin-bottom: 8px;
            padding-bottom: 5px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th {
            background: #f0f4f8;
            color: #323f4b;
            font-size: 10px;
            text-align: left;
            text-transform: uppercase;
        }
        tfoot td {
            background: #f8fafc;
            font-weight: 700;
        }
        th, td {
            border: 1px solid #d9e2ec;
            padding: 6px;
            vertical-align: top;
        }
        .number {
            text-align: right;
            white-space: nowrap;
        }
        .empty {
            color: #7b8794;
            font-style: italic;
            text-align: center;
        }
        .muted {
            color: #7b8794;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <header class="header">
        <div>
            <h1 class="brand">Carniceria POS</h1>
            <p class="subtitle">Reporte de cierre de caja</p>
        </div>
        <div class="meta">
            <p><strong>Cierre #${close.id}</strong></p>
            <p>Inicio: ${formatDate(close.start_at)}</p>
            <p>Fin: ${formatDate(close.end_at)}</p>
        </div>
    </header>

    <section class="summary">
        ${renderSummary(report)}
    </section>

    <section class="highlight">
        <strong>Resumen operativo:</strong>
        carnes ${formatMoney(summary.totalMeat)}, mercaderia ${formatMoney(summary.totalMerchandise)},
        ingreso real ${formatMoney(summary.realIncome)}.
    </section>

    <section class="section">
        <h2>Ventas</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Pago</th>
                    <th class="number">Carne</th>
                    <th class="number">Mercaderia</th>
                    <th class="number">Total</th>
                </tr>
            </thead>
            <tbody>${renderSales(report)}</tbody>
            ${renderSalesSubtotal(report)}
        </table>
    </section>

    <section class="section">
        <h2>Carne</h2>
        <table>
            <thead>
                <tr>
                    <th>Venta</th>
                    <th>Fecha</th>
                    <th>Pago</th>
                    <th class="number">Importe carne</th>
                </tr>
            </thead>
            <tbody>${renderMeatSales(report)}</tbody>
            ${renderMeatSalesSubtotal(report)}
        </table>
    </section>

    <section class="section">
        <h2>Mercaderia</h2>
        <table>
            <thead>
                <tr>
                    <th>Venta</th>
                    <th>Fecha</th>
                    <th>Pago</th>
                    <th class="number">Importe mercaderia</th>
                </tr>
            </thead>
            <tbody>${renderMerchandiseSales(report)}</tbody>
            ${renderMerchandiseSalesSubtotal(report)}
        </table>
    </section>

    <section class="section">
        <h2>Gastos</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Categoria</th>
                    <th>Descripcion</th>
                    <th class="number">Importe</th>
                </tr>
            </thead>
            <tbody>${renderExpenses(report)}</tbody>
            ${renderExpensesSubtotal(report)}
        </table>
    </section>

    <section class="section">
        <h2>Deudas generadas</h2>
        <table>
            <thead>
                <tr>
                    <th>Nro. deuda</th>
                    <th>Fecha</th>
                    <th>Venta</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th class="number">Saldo</th>
                </tr>
            </thead>
            <tbody>${renderGeneratedDebts(report)}</tbody>
            ${renderGeneratedDebtsSubtotal(report)}
        </table>
    </section>

    <section class="section">
        <h2>Pagos de deuda</h2>
        <table>
            <thead>
                <tr>
                    <th>ID pago</th>
                    <th>Fecha</th>
                    <th>Nro. deuda</th>
                    <th>Cliente</th>
                    <th>Pago</th>
                    <th class="number">Importe</th>
                </tr>
            </thead>
            <tbody>${renderPaidDebts(report)}</tbody>
            ${renderPaidDebtsSubtotal(report)}
        </table>
    </section>
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

export class CloseReportPdfService {
    async generateCloseReportPdf(report: CloseReportData): Promise<Buffer> {
        let browser: Browser | undefined

        try {
            browser = await puppeteer.launch(buildLaunchOptions())
            const page = await browser.newPage()
            await page.setContent(renderCloseReportHtml(report), { waitUntil: 'load' })
            const pdf = await page.pdf(pdfOptions)

            return Buffer.from(pdf)
        } finally {
            await browser?.close()
        }
    }
}

export const closeReportPdfService = new CloseReportPdfService()
