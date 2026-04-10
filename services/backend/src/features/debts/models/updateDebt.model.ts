import { DebtUpdateSchema,DebtUpdateData } from '@carniceria/shared'

export class UpdateDebt implements DebtUpdateData {
    private readonly _amount : number 
    private readonly _status : 'pending' | 'paid' | 'partial'

    constructor(data: unknown) {

        const validated = DebtUpdateSchema.parse(data)

        this._amount = validated.amount
        this._status = validated.status
    }

    get amount() : number { return this._amount; }
    get status() : 'pending' | 'paid' | 'partial' { return this._status; }
}