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

// Los montos declarados por el cajero pueden faltar; en ese caso no inventamos un 0.
function formatMoney(value: number | null | undefined): string {
    return value === null || value === undefined ? '&mdash;' : currencyFormatter.format(value)
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

// Ordena los movimientos por hora, de mas temprano a mas tarde.
function byTimeAsc<T extends { created_at: Date | null | undefined }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        const timeA = a.created_at ? a.created_at.getTime() : 0
        const timeB = b.created_at ? b.created_at.getTime() : 0
        return timeA - timeB
    })
}

function renderSummary(report: CloseReportData): string {
    const { summary } = report

    const rows: Array<[string, number | null, string]> = [
        ['Total ventas', summary.totalSales, ''],
        ['Ventas efectivo', summary.totalCash, ''],
        ['Ventas transferencia', summary.totalTransfer, ''],
        ['Ventas tarjeta', summary.totalCard, ''],
        ['Cuenta corriente generada', summary.totalDebtGenerated, ''],
        ['Deudas cobradas', summary.totalDebtPaid, ''],
        ['Gastos', summary.totalExpenses, 'neg'],
        ['Ingreso real', summary.realIncome, 'pos'],
        ['Efectivo contado', summary.expectedCash, ''],
        ['Cierre de posnet', summary.expectedCard, ''],
    ]

    return rows.map(([label, value, tone]) => `
        <div class="summary-item">
            <span>${escapeHtml(label)}</span>
            <strong class="${tone}">${formatMoney(value)}</strong>
        </div>
    `).join('')
}

function renderPayMethodBreakdown(report: CloseReportData): string {
    const { sales, summary } = report

    const rows: Array<[string, number, number]> = [
        ['Efectivo', sales.byPayMethod.cash.length, summary.totalCash],
        ['Tarjeta', sales.byPayMethod.card.length, summary.totalCard],
        ['Transferencia', sales.byPayMethod.transfer.length, summary.totalTransfer],
        ['Cuenta corriente', sales.byPayMethod.cc.length, summary.totalDebtGenerated],
    ]

    const body = rows.map(([label, count, amount]) => `
        <tr>
            <td>${escapeHtml(label)}</td>
            <td class="number">${count}</td>
            <td class="number">${formatMoney(amount)}</td>
        </tr>
    `).join('')

    return `
        ${body}
        <tr class="subtotal">
            <td>Total</td>
            <td class="number">${sales.all.length}</td>
            <td class="number">${formatMoney(summary.totalSales)}</td>
        </tr>
    `
}

function differenceLabel(difference: number): string {
    return difference < 0 ? 'Faltante' : difference > 0 ? 'Sobrante' : 'Sin diferencia'
}

function differenceTone(difference: number): string {
    return difference === 0 ? 'pos' : 'neg'
}

// Arqueo por rubro: lo declarado contra lo que deberia haber segun el sistema.
// Permite ver de que lado esta el error en vez de "revisar todo".
function renderCashCheck(report: CloseReportData): string {
    const { reconciliation } = report.summary

    const lines: string[] = [
        `<div class="check-line">
            <span>Arqueo de caja</span>
            <span>
                contado ${formatMoney(reconciliation.sideTwo.cash)}
                &minus; teorico ${formatMoney(reconciliation.theoreticalCash)}
                = ${reconciliation.cashDifference === null
                    ? '<strong>sin declarar</strong>'
                    : `<strong class="${differenceTone(reconciliation.cashDifference)}">${formatMoney(reconciliation.cashDifference)}</strong> (${differenceLabel(reconciliation.cashDifference)})`}
            </span>
        </div>`,
        `<div class="check-line">
            <span>Arqueo de posnet</span>
            <span>
                declarado ${formatMoney(reconciliation.sideTwo.card)}
                &minus; teorico ${formatMoney(reconciliation.theoreticalCard)}
                = ${reconciliation.cardDifference === null
                    ? '<strong>sin declarar</strong>'
                    : `<strong class="${differenceTone(reconciliation.cardDifference)}">${formatMoney(reconciliation.cardDifference)}</strong> (${differenceLabel(reconciliation.cardDifference)})`}
            </span>
        </div>`,
    ]

    if (reconciliation.unexplainedDifference !== null && reconciliation.unexplainedDifference !== 0) {
        lines.push(`<div class="check-line">
            <span>Diferencia no explicada</span>
            <span>
                <strong class="neg">${formatMoney(reconciliation.unexplainedDifference)}</strong>
                &mdash; revisar ventas en cuenta corriente sin deuda asociada
            </span>
        </div>`)
    }

    const teoricoCash = 'ventas en efectivo + cobros de cta cte en efectivo &minus; gastos pagados'
    const teoricoCard = 'ventas con tarjeta + cobros de cta cte con tarjeta'

    return `
        ${lines.join('')}
        <p class="check-note">
            Teorico de caja = ${teoricoCash}. Teorico de posnet = ${teoricoCard}.
        </p>
    `
}

// Cuadre de cierre final, con la misma estructura que se hace a mano:
// dos totales que tienen que coincidir.
function renderFinalCheck(report: CloseReportData): string {
    const { reconciliation } = report.summary
    const { sideOne, sideTwo } = reconciliation

    const row = (label: string, value: number | null, note = '') => `
        <tr>
            <td>${escapeHtml(label)}${note ? ` <span class="muted">${escapeHtml(note)}</span>` : ''}</td>
            <td class="number">${formatMoney(value)}</td>
        </tr>
    `

    const differenceRow = reconciliation.difference === null
        ? `<tr class="subtotal">
                <td>Diferencia &#9313; &minus; &#9312;</td>
                <td class="number balance-cell">&mdash;</td>
           </tr>
           <tr>
                <td colspan="2" class="empty">
                    Faltan montos declarados en este cierre, no se puede calcular el cuadre.
                </td>
           </tr>`
        : `<tr class="subtotal">
                <td>Diferencia &#9313; &minus; &#9312; <span class="muted">debe dar cero</span></td>
                <td class="number balance-cell ${differenceTone(reconciliation.difference)}">
                    ${formatMoney(reconciliation.difference)}
                </td>
           </tr>`

    return `
        <table>
            <thead>
                <tr>
                    <th>Concepto</th>
                    <th class="number">Importe</th>
                </tr>
            </thead>
            <tbody>
                <tr class="group"><td colspan="2">&#9312; Lo que se vendio y se cobro</td></tr>
                ${row('Tickets de carne', sideOne.meat)}
                ${row('Vineria / mercaderia', sideOne.merchandise)}
                ${row('Recibido cta cte', sideOne.debtPaid)}
                <tr class="subtotal">
                    <td>Total &#9312;</td>
                    <td class="number">${formatMoney(sideOne.total)}</td>
                </tr>

                <tr class="group"><td colspan="2">&#9313; Donde esta ese dinero</td></tr>
                ${row('Efectivo contado', sideTwo.cash, 'declarado')}
                ${row('Cierre de posnet', sideTwo.card, 'declarado')}
                ${row('M.P', sideTwo.transfer, 'transferencias')}
                ${row('Boletas cta cte', sideTwo.debtGenerated, 'vendido, no cobrado')}
                ${row('Gastos pagados', sideTwo.expenses, 'salieron de la caja')}
                <tr class="subtotal">
                    <td>Total &#9313;</td>
                    <td class="number">${formatMoney(sideTwo.total)}</td>
                </tr>
            </tbody>
            <tfoot>${differenceRow}</tfoot>
        </table>
    `
}

function renderBalance(report: CloseReportData): string {
    const { summary } = report

    const totalIncome = Number((summary.totalSales + summary.totalDebtPaid).toFixed(2))
    const totalOutflow = Number((summary.totalExpenses + summary.totalDebtGenerated + summary.realIncome).toFixed(2))
    const balance = Number((totalIncome - totalOutflow).toFixed(2))
    const tone = balance < 0 ? 'neg' : 'pos'

    const rows: Array<[string, number | null, number | null]> = [
        ['Total ventas', summary.totalSales, null],
        ['Deudas cobradas', summary.totalDebtPaid, null],
        ['Gastos', null, summary.totalExpenses],
        ['Cuenta corriente generada', null, summary.totalDebtGenerated],
        ['Ingreso real (resultado)', null, summary.realIncome],
    ]

    const body = rows.map(([label, income, outflow]) => `
        <tr>
            <td>${escapeHtml(label)}</td>
            <td class="number">${income === null ? '&mdash;' : formatMoney(income)}</td>
            <td class="number">${outflow === null ? '&mdash;' : formatMoney(outflow)}</td>
        </tr>
    `).join('')

    return `
        ${body}
        <tr class="subtotal">
            <td>Totales</td>
            <td class="number">${formatMoney(totalIncome)}</td>
            <td class="number">${formatMoney(totalOutflow)}</td>
        </tr>
        <tr class="subtotal">
            <td>Balance</td>
            <td class="number balance-cell ${tone}" colspan="2">${formatMoney(balance)}</td>
        </tr>
    `
}

function renderSales(report: CloseReportData): string {
    const rows = byTimeAsc(report.sales.all).map((sale) => {
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
    const rows = byTimeAsc(report.sales.all)
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
    const rows = byTimeAsc(report.sales.all)
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
    const rows = byTimeAsc(report.expenses).map((expense) => `
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
    const rows = byTimeAsc(report.debts.generated).map((debt) => `
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
    const rows = byTimeAsc(report.debts.paid).map((payment) => `
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
    const salesCount = report.sales.all.length
    const averageTicket = salesCount ? summary.totalSales / salesCount : 0

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
        .pos { color: #15803d; }
        .neg { color: #b91c1c; }
        .balance-cell {
            font-size: 14px;
            font-weight: 700;
        }
        .highlight {
            background: #f0f4f8;
            border: 1px solid #bcccdc;
            margin-bottom: 12px;
            padding: 10px;
        }
        .cash-check {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 4px;
            margin-bottom: 18px;
            padding: 10px;
        }
        .check-line {
            display: flex;
            gap: 10px;
            justify-content: space-between;
        }
        .check-line + .check-line {
            border-top: 1px solid #fde68a;
            margin-top: 5px;
            padding-top: 5px;
        }
        .check-line > span:first-child {
            font-weight: 700;
            white-space: nowrap;
        }
        .check-line > span:last-child {
            text-align: right;
        }
        .check-note {
            border-top: 1px solid #fde68a;
            color: #78716c;
            font-size: 10px;
            margin-top: 7px;
            padding-top: 5px;
        }
        tr.group td {
            background: #f0f4f8;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }
        .section {
            margin-top: 18px;
            page-break-inside: avoid;
        }
        .section h2 {
            background: var(--accent-bg, #f0f4f8);
            border-left: 4px solid var(--accent, #1f2933);
            border-radius: 4px;
            color: var(--accent, #1f2933);
            font-size: 15px;
            margin-bottom: 10px;
            padding: 7px 10px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        thead {
            display: table-header-group;
        }
        tfoot {
            display: table-row-group;
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
        ${salesCount} ventas, ticket promedio ${formatMoney(averageTicket)},
        carnes ${formatMoney(summary.totalMeat)}, mercaderia ${formatMoney(summary.totalMerchandise)},
        ingreso real ${formatMoney(summary.realIncome)}.
    </section>

    <section class="section" style="--accent:#7c2d12; --accent-bg:#fff7ed;">
        <h2>Cierre final</h2>
        ${renderFinalCheck(report)}
    </section>

    <section class="cash-check">
        ${renderCashCheck(report)}
    </section>

    <section class="section" style="--accent:#0f766e; --accent-bg:#f0fdfa;">
        <h2>Totales por metodo de pago</h2>
        <table>
            <thead>
                <tr>
                    <th>Metodo</th>
                    <th class="number">Cantidad</th>
                    <th class="number">Importe</th>
                </tr>
            </thead>
            <tbody>${renderPayMethodBreakdown(report)}</tbody>
        </table>
    </section>

    <section class="section" style="--accent:#334155; --accent-bg:#f1f5f9;">
        <h2>Balance de ingresos / egresos</h2>
        <table>
            <thead>
                <tr>
                    <th>Concepto</th>
                    <th class="number">Ingresos</th>
                    <th class="number">Egresos</th>
                </tr>
            </thead>
            <tbody>${renderBalance(report)}</tbody>
        </table>
    </section>

    <section class="section" style="--accent:#1d4ed8; --accent-bg:#eff6ff;">
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

    <section class="section" style="--accent:#b91c1c; --accent-bg:#fef2f2;">
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

    <section class="section" style="--accent:#b45309; --accent-bg:#fffbeb;">
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

    <section class="section" style="--accent:#475569; --accent-bg:#f1f5f9;">
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

    <section class="section" style="--accent:#6d28d9; --accent-bg:#f5f3ff;">
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

    <section class="section" style="--accent:#15803d; --accent-bg:#f0fdf4;">
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
