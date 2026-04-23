import { DebtSchema,  DebtData } from '@carniceria/shared'

export class Debt implements DebtData {
    private readonly _id:number
    private readonly _created_at: Date
    private readonly _status: DebtData['status']
    private readonly _sales_id : number
    private readonly _customer_id : number
    private readonly _amount : number 

    constructor(data: unknown) {

        const validated = DebtSchema.parse(data) 
        this._id = validated.id
        this._created_at = validated.created_at
        this._status = validated.status
        this._sales_id = validated.sales_id
        this._customer_id = validated.customer_id
        this._amount = validated.amount
    }

    get id() : number { return this._id}
    get created_at(): Date {return this._created_at}
    get status() : DebtData['status'] { return this._status}
    get sales_id() : number { return this._sales_id; }
    get customer_id() : number { return this._customer_id; }
    get amount() : number { return this._amount; }
}

