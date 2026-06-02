import * as dotenv from 'dotenv'

// setupFiles se importan en el entorno de test; ejecutar la carga
// de variables en código top-level garantiza que se apliquen.
dotenv.config({ path: '.env.test' })
console.log('Variables de entorno cargadas para tests (setupFiles)')

import { afterAll, beforeAll, beforeEach } from 'vitest'
import { pool } from '../db'
import { cleanDatabase } from './helpers/cleanDatabase'

beforeAll(async () => {                                       //antes que nada verifica coneccion a db
  try {
    await pool.query('SELECT 1')
    console.log('✓ Conectado a la DB de test')
  } catch (error) {
    console.error('✗ No se pudo conectar a la DB de test')
    process.exit(1)
  }
  await cleanDatabase()   // limpia datos que pudo dejar el archivo de test anterior
})

beforeEach(async () => {        //luego de cada test limpia la base para que no haya interferencia entre tests
  await cleanDatabase()
})

// En watch mode (vitest sin 'run') el módulo db.ts queda en caché entre runs
// y un pool cerrado no se puede reabrir. Solo cerramos en single run
const isSingleRun = process.argv.some(arg => arg === 'run')

afterAll(async () => {
  if (isSingleRun) await pool.end()
})



