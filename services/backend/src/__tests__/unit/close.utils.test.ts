import { describe, expect, it } from 'vitest'
import { buildReconciliation, splitDebtPaidByMethod, ReconciliationInput } from '../../features/closes/close.utils'

// Escenario base y consistente: las ventas por metodo suman los totales por rubro,
// y la venta en cuenta corriente tiene su deuda generada equivalente.
//
//   carne 1100 + vineria 500 = 1600 = efectivo 1000 + transfer 300 + tarjeta 200 + cta cte 100
//
// Con lo declarado igual a lo teorico, el cuadre tiene que dar cero.
const baseInput = (overrides?: Partial<ReconciliationInput>): ReconciliationInput => ({
    totalMeat: 1100,
    totalMerchandise: 500,
    totalCash: 1000,
    totalTransfer: 300,
    totalCard: 200,
    totalDebtGenerated: 100,
    totalDebtPaid: 100,
    totalExpenses: 300,
    debtPaidByMethod: { cash: 100, card: 0, transfer: 0 },
    declaredCash: 800,
    declaredCard: 200,
    ...overrides,
})

describe('splitDebtPaidByMethod', () => {
    it('agrupa credito y debito como tarjeta', () => {
        const result = splitDebtPaidByMethod([
            { paid_amount: 100, pay_method: 'cash' },
            { paid_amount: 50, pay_method: 'credit' },
            { paid_amount: 25, pay_method: 'debit' },
            { paid_amount: 10, pay_method: 'transfer' },
        ])

        expect(result).toEqual({ cash: 100, card: 75, transfer: 10 })
    })

    it('devuelve ceros sin pagos', () => {
        expect(splitDebtPaidByMethod([])).toEqual({ cash: 0, card: 0, transfer: 0 })
    })
})

describe('buildReconciliation', () => {
    it('cuadra en cero cuando lo declarado coincide con lo teorico', () => {
        const result = buildReconciliation(baseInput())

        // Lado 1: 1100 + 500 + 100 = 1700
        expect(result.sideOne.total).toBe(1700)
        // Lado 2: 800 efectivo + 200 posnet + 300 M.P + 100 cta cte + 300 gastos = 1700
        expect(result.sideTwo.total).toBe(1700)
        expect(result.difference).toBe(0)
        expect(result.cashDifference).toBe(0)
        expect(result.cardDifference).toBe(0)
        expect(result.unexplainedDifference).toBe(0)
    })

    it('calcula el teorico de caja restando gastos y sumando cobros en efectivo', () => {
        const result = buildReconciliation(baseInput())

        // ventas efectivo 1000 + cobros en efectivo 100 - gastos 300
        expect(result.theoreticalCash).toBe(800)
        // ventas tarjeta 200 + cobros con tarjeta 0
        expect(result.theoreticalCard).toBe(200)
    })

    it('atribuye un sobrante de efectivo al arqueo de caja', () => {
        const result = buildReconciliation(baseInput({ declaredCash: 950 }))

        expect(result.cashDifference).toBe(150)
        expect(result.cardDifference).toBe(0)
        expect(result.difference).toBe(150)
        expect(result.unexplainedDifference).toBe(0)
    })

    it('atribuye un faltante de posnet al arqueo de posnet', () => {
        const result = buildReconciliation(baseInput({ declaredCard: 180 }))

        expect(result.cashDifference).toBe(0)
        expect(result.cardDifference).toBe(-20)
        expect(result.difference).toBe(-20)
        expect(result.unexplainedDifference).toBe(0)
    })

    it('descompone la diferencia total en los dos arqueos', () => {
        const result = buildReconciliation(baseInput({ declaredCash: 850, declaredCard: 190 }))

        expect(result.cashDifference).toBe(50)
        expect(result.cardDifference).toBe(-10)
        expect(result.difference).toBe(40)
        expect(result.unexplainedDifference).toBe(0)
    })

    // Un cobro de cuenta corriente por transferencia no entra ni a la caja ni al posnet:
    // tiene que sumar del lado 2 junto con las ventas por transferencia.
    it('mantiene el cuadre cuando una deuda se cobra por transferencia', () => {
        const result = buildReconciliation(baseInput({
            debtPaidByMethod: { cash: 0, card: 0, transfer: 100 },
            declaredCash: 700, // sin el cobro en efectivo: 1000 - 300 de gastos
        }))

        expect(result.sideTwo.transfer).toBe(400)
        expect(result.difference).toBe(0)
        expect(result.unexplainedDifference).toBe(0)
    })

    // Un cobro de cuenta corriente con tarjeta aparece en el cierre del posnet.
    it('mantiene el cuadre cuando una deuda se cobra con tarjeta', () => {
        const result = buildReconciliation(baseInput({
            debtPaidByMethod: { cash: 0, card: 100, transfer: 0 },
            declaredCash: 700,
            declaredCard: 300,
        }))

        expect(result.theoreticalCard).toBe(300)
        expect(result.difference).toBe(0)
        expect(result.unexplainedDifference).toBe(0)
    })

    // Si la deuda generada no coincide con la venta en cuenta corriente, la diferencia
    // no puede explicarse por los arqueos: es una inconsistencia de datos.
    it('expone como no explicada una deuda generada que no coincide con la venta en cta cte', () => {
        const result = buildReconciliation(baseInput({ totalDebtGenerated: 1500 }))

        expect(result.cashDifference).toBe(0)
        expect(result.cardDifference).toBe(0)
        expect(result.difference).toBe(1400)
        expect(result.unexplainedDifference).toBe(1400)
    })

    it('no calcula el cuadre si falta el efectivo contado', () => {
        const result = buildReconciliation(baseInput({ declaredCash: null }))

        expect(result.difference).toBeNull()
        expect(result.cashDifference).toBeNull()
        expect(result.sideTwo.total).toBeNull()
        expect(result.unexplainedDifference).toBeNull()
        // El lado calculado sigue disponible.
        expect(result.sideOne.total).toBe(1700)
        expect(result.cardDifference).toBe(0)
    })

    it('no calcula el cuadre si falta el cierre de posnet', () => {
        const result = buildReconciliation(baseInput({ declaredCard: null }))

        expect(result.difference).toBeNull()
        expect(result.cardDifference).toBeNull()
        expect(result.cashDifference).toBe(0)
    })

    it('redondea a dos decimales', () => {
        const result = buildReconciliation(baseInput({
            totalCash: 1000.005,
            declaredCash: 800.1,
        }))

        expect(result.cashDifference).toBe(Number(result.cashDifference?.toFixed(2)))
        expect(result.theoreticalCash).toBe(Number(result.theoreticalCash.toFixed(2)))
    })
})
