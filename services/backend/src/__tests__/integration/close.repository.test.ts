import { closeRepository } from '../../features/closes/close.repository';
import { createTestClose, createTestSale, createTestCustomer, finishTestClose} from '../helpers/createTestData'
import { saleRepository } from '../../features/sales/sale.repository';

describe('CloseRepository', () => {
    
    describe('create', () => {

        it('should create a new close', async () => {
            const customer = await createTestCustomer()
            const sale = await createTestSale({ customer_id: customer.id })
            const close = await createTestClose()
            const set = await saleRepository.setClosed( close.id , [sale.id] )
            const sales = await saleRepository.getAll({ id: sale.id })
            
            expect(close).toHaveProperty('id')
            expect(set).toBe(true)
            expect(sales).toHaveLength(1)
            expect(sales[0].close_id).toBe(close.id)
        })

        describe('getAll' ,() => {

            it('should return all closes', async () => {
                const customer =await createTestCustomer()
                const sale = await createTestSale({ customer_id: customer.id })
                const close = await createTestClose()
                await createTestClose()
                await saleRepository.setClosed( close.id , [sale.id] )
                const closes = await closeRepository.getAll()

                expect(closes?.length).toBe(2)

            })

            it('should return closes filtered by id', async () => {
                const customer =await createTestCustomer()
                const sale = await createTestSale({ customer_id: customer.id })
                const close = await createTestClose()
                await createTestClose()
                const returnedClose = await closeRepository.getAll({ id: close.id })

                expect(returnedClose?.length).toBe(1)
                expect(returnedClose?.[0].id).toBe(close.id)
                
            })          

            it('should return closes filtered by start_at', async () => {
                const customer =await createTestCustomer()
                const sale = await createTestSale({ customer_id: customer.id })
                const close = await createTestClose()
                const returnedClose = await closeRepository.getAll({ start_at: close.start_at })

                expect(returnedClose?.length).toBe(1)
                expect(returnedClose?.[0].id).toBe(close.id)
            })

            it('should return closes fultered by close_at', async () => {
                const customer = await createTestCustomer()
                const sale = await createTestSale({ customer_id: customer.id })
                const close = await createTestClose()
                const finishClose = await finishTestClose(close.id)
                const returnedClose = await closeRepository.getAll({ end_at: finishClose?.end_at })

                expect(returnedClose?.length).toBe(1)
                expect(returnedClose?.[0].id).toBe(close.id)
            })
        })

        describe('finish', () => {

            it('should finish a close', async () => {
                const customer = await createTestCustomer()
                const sale = await createTestSale({ customer_id: customer.id })
                const close = await createTestClose()
                await saleRepository.setClosed( close.id , [sale.id] )
                const finishClose = await finishTestClose(close.id)

                expect(finishClose).not.toBeNull()
                expect(finishClose?.end_at).not.toBeNull()
                expect(finishClose?.total_income).toBe(600)
                expect(finishClose?.total_expense).toBe(500)
            })
            
            it('should not finish a close that is already finished', async () => {
                const customer = await createTestCustomer()
                const sale = await createTestSale({ customer_id: customer.id })
                const close = await createTestClose()
                await saleRepository.setClosed( close.id , [sale.id] )
                await finishTestClose(close.id)
                const finishCloseAgain = await finishTestClose(close.id)

                expect(finishCloseAgain).toBeNull()
            })
            
        })
    })
});