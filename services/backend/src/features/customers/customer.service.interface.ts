import { Customer } from './models/customer.model';

export interface CustomerFilters {
    name?: string ;
}

export interface ICustomerService {
    register( data : unknown ) : Promise< Customer >;
    search(filters : CustomerFilters) : Promise< Customer[] >;
    getById(id: number) : Promise< Customer >;
    delete( id : number ) : Promise< void >;
}