import { pool } from '../../db'

describe('Database connection', () => {
  it('should connect to the test database', async () => {
    const { rows } = await pool.query('SELECT current_database()')
    expect(rows[0].current_database).toBe('carniceria_test')
  })
})  