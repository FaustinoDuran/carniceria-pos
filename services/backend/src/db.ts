import { Pool, types } from 'pg'
import { config } from './config'

// PostgreSQL returns NUMERIC as string by default; parse it as number for domain models.
types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value))

export const pool = new Pool({
    ...(config.db.connectionString
        ? { connectionString: config.db.connectionString }
        : {
            host: config.db.host,
            port: config.db.port,
            database: config.db.database,
            user: config.db.user,
            password: config.db.password,
        }),
    ssl: config.db.ssl ? { rejectUnauthorized: false } : undefined,
})

pool.on('error',(err) => {
    console.error('Error inesperado en el pool de postgres',err)
    process.exit(-1)
})
