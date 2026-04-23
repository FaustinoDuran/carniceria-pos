import { DebtUpdateSchema,DebtUpdateData } from '@carniceria/shared'

export class UpdateDebt implements DebtUpdateData {
    private readonly _amount : number 
    private readonly _status : DebtUpdateData['status']

    constructor(data: unknown) {

        const validated = DebtUpdateSchema.parse(data)

        this._amount = validated.amount
        this._status = validated.status
    }

    get amount() : number { return this._amount; }
    get status() : DebtUpdateData['status'] { return this._status; }
}