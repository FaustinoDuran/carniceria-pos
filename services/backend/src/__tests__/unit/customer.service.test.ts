import { customerService } from '../../features/customers/customer.service'
import { CustomerRepository } from '../../features/customers/customer.repository'
import { NotFoundError } from '../../shared/errors'


vi.mock(`../../features/customers/customer.repository`)

describe('CustomerService', () => {
    
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getAll', () => {})
    


})