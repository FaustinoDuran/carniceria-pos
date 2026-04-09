import { Pool } from 'pg'
import { config } from './config'

export const pool = new Pool(config.db)

pool.on('error',(err) => {
    console.error('Error inesperado en el pool de postgres',err)
    process.exit(-1)
})