import { DebtUpdateSchema,DebtUpdateData } from '@carniceria/shared'

export class UpdateDebt implements DebtUpdateData {
    private readonly _amount : number 
    private readonly _status : DebtUpdateData['status']
    private readonly _pay_method : DebtUpdateData['pay_method']
    private readonly _updated_at : Date | null

    constructor(data: unknown) {

        const validated = DebtUpdateSchema.parse(data)

        this._amount = validated.amount
        this._status = validated.status
        this._pay_method = validated.pay_method
        this._updated_at = validated.updated_at 
    }

    get amount() : number { return this._amount; }
    get status() : DebtUpdateData['status'] { return this._status; }
    get pay_method() : DebtUpdateData['pay_method'] { return this._pay_method; }
    get updated_at() : Date | null { return this._updated_at; }
}