import { Customer} from './models/customer.model';
import { CustomerDTO } from './models/customer.dto';

export interface CustomerFilters {
    name?: string ;
}

export interface ICustomerService {
    register( data : CustomerDTO) : Promise< Customer >;
    search(filters : CustomerFilters) : Promise< Customer[] >;
    getById(id: number) : Promise< Customer >;
    delete( id : number ) : Promise< void >;
}