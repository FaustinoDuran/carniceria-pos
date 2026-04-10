import { CreateCustomerSchema, CreateCustomerData } from '@carniceria/shared'

export class Customer implements CreateCustomerData {
    private readonly _name: string
    private readonly _last_name: string
    private readonly _phone?: string
    private readonly _dni?: string

    constructor(data: unknown) {

        const validated = CreateCustomerSchema.parse(data)

        
        this._name = validated.name
        this._last_name = validated.last_name
        this._phone = validated.phone
        this._dni = validated.dni
    }

    get name() : string { return this._name; }
    get last_name() : string { return this._last_name; }
    get phone() : string | undefined { return this._phone; }
    get dni() : string | undefined { return this._dni; }
}

