import { CustomerSchema, CustomerData } from '@carniceria/shared'

export class Customer implements CustomerData {
    private readonly _name: string
    private readonly _last_name: string
    private readonly _phone?: string
    private readonly _dni?: string
    private readonly _id: number;
    private readonly _created_at:  Date;
    private readonly _deleted_at:  Date | null;

    constructor(data: unknown) {

        const validated = CustomerSchema.parse(data)

        
        this._name = validated.name
        this._last_name = validated.last_name
        this._phone = validated.phone
        this._dni = validated.dni
        this._id = validated.id
        this._created_at = validated.created_at
        this._deleted_at = validated.deleted_at
    }

    get name() : string { return this._name; }
    get last_name() : string { return this._last_name; }
    get phone() : string | undefined { return this._phone; }
    get dni() : string | undefined { return this._dni; }
    get id() : number { return this._id; }
    get created_at() :  Date { return this._created_at; }
    get deleted_at() : Date | null { return this._deleted_at; }
}
