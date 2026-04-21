import { CreateSalesData, CreateSalesSchema } from '@carniceria/shared';

export class SaleDTO implements CreateSalesData {
    private readonly _amount_meat: number;
    private readonly _amount_merchandise: number;
    private readonly _pay_method: CreateSalesData['pay_method'];

    constructor(data: unknown) {
        
        const validated = CreateSalesSchema.parse(data);

        this._amount_meat = validated.amount_meat;
        this._amount_merchandise = validated.amount_merchandise;
        this._pay_method = validated.pay_method;
    }

    get amount_meat(): number { return this._amount_meat; }
    get amount_merchandise(): number { return this._amount_merchandise; }
    get pay_method(): CreateSalesData['pay_method'] { return this._pay_method; }
}