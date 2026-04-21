import { SalesData, SalesSchema } from '@carniceria/shared';

export class Sale implements SalesData {
    private readonly _amount_meat: number;
    private readonly _amount_merchandise: number;
    private readonly _pay_method: SalesData['pay_method'];
    private readonly _id: number;
    private readonly _close_id: number | null;
    private readonly _created_at: Date 


    constructor(data: unknown) {
        
        const validated = SalesSchema.parse(data);

        this._amount_meat = validated.amount_meat;
        this._amount_merchandise = validated.amount_merchandise;
        this._pay_method = validated.pay_method;
        this._id = validated.id;
        this._close_id = validated.close_id;
        this._created_at = validated.created_at;
    }

    get amount_meat(): number { return this._amount_meat; }
    get amount_merchandise(): number { return this._amount_merchandise; }
    get pay_method(): SalesData['pay_method'] { return this._pay_method; }
    get id(): number { return this._id; }
    get close_id(): number | null { return this._close_id; }
    get created_at(): Date { return this._created_at; }
}

