import { RecordDebtPaymentSchema, RecordDebtPaymentData } from '@carniceria/shared'

export class RecordDebtPayment implements RecordDebtPaymentData {
    private readonly _paid_amount: number
    private readonly _pay_method: RecordDebtPaymentData['pay_method']

    constructor(data: unknown) {
        const validated = RecordDebtPaymentSchema.parse(data)

        this._paid_amount = validated.paid_amount
        this._pay_method = validated.pay_method
    }

    get paid_amount(): number { return this._paid_amount }
    get pay_method(): RecordDebtPaymentData['pay_method'] { return this._pay_method }
}
