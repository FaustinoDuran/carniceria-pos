import { SalesCreateData, SalesCreateSchema } from '@carniceria/shared';

export class Sale implements SalesCreateData {
    private readonly _mount_meat: number;
    private readonly _amount_merchandise: number;
    private readonly _pay_method: 'cash' | 'credit' | 'cc' | 'debit' | 'transfer';

    constructor(data: unknown) {
        
        const validated = SalesCreateSchema.parse(data);

        this._mount_meat = validated.mount_meat;
        this._amount_merchandise = validated.amount_merchandise;
        this._pay_method = validated.pay_method;
    }

    get mount_meat(): number { return this._mount_meat; }
    get amount_merchandise(): number { return this._amount_merchandise; }
    get pay_method(): 'cash' | 'credit' | 'cc' | 'debit' | 'transfer' { return this._pay_method; }
}