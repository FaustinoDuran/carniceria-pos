import { pool } from '../../db'

export async function cleanDatabase() {
  try {
    await pool.query(`
      TRUNCATE TABLE
        debt_payment_events,
        sale_details,
        debts,
        sales,
        expenses,
        closes,
        customers
      RESTART IDENTITY CASCADE
    `)
  } catch (err) {
    console.error('[cleanDatabase] TRUNCATE falló:', err)
    throw err
  }
}