import { DebtPaymentEventSchema, DebtPaymentEventData } from '@carniceria/shared'

export class DebtPaymentEvent implements DebtPaymentEventData {
    private readonly _id: number
    private readonly _debt_id: number
    private readonly _close_id: number
    private readonly _paid_amount: number
    private readonly _pay_method: DebtPaymentEventData['pay_method']
    private readonly _created_at: Date

    constructor(data: unknown) {
        const validated = DebtPaymentEventSchema.parse(data)

        this._id = validated.id
        this._debt_id = validated.debt_id
        this._close_id = validated.close_id
        this._paid_amount = validated.paid_amount
        this._pay_method = validated.pay_method
        this._created_at = validated.created_at
    }

    get id(): number { return this._id }
    get debt_id(): number { return this._debt_id }
    get close_id(): number { return this._close_id }
    get paid_amount(): number { return this._paid_amount }
    get pay_method(): DebtPaymentEventData['pay_method'] { return this._pay_method }
    get created_at(): Date { return this._created_at }
}
