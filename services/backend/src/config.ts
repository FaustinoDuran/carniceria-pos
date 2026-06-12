import dotenv from 'dotenv'

const envFile = process.env.ENV_FILE || (process.env.NODE_ENV === 'test' ? '.env.test' : '.env')
dotenv.config({ path: envFile })

const isProduction = process.env.NODE_ENV === 'production'

const defaultDevCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]

const parseCorsOrigins = (value: string | undefined): string[] => {
  if (value === undefined) {
    return isProduction ? [] : defaultDevCorsOrigins
  }

  return value.split(',').map((origin) => origin.trim()).filter(Boolean)
}

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const required = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

const authEnabled = parseBoolean(process.env.SUPABASE_AUTH_ENABLED, isProduction)
const supabaseUrl = process.env.SUPABASE_URL

if (authEnabled && !supabaseUrl) {
  throw new Error('SUPABASE_URL is required when SUPABASE_AUTH_ENABLED is true')
}

export const config = {
  port: process.env.PORT || 3000,
  trustProxy: parseBoolean(process.env.TRUST_PROXY, isProduction),
  cors: {
    allowedOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  },
  db: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'carniceria',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'admin123',
    ssl: parseBoolean(process.env.DB_SSL, Boolean(process.env.DATABASE_URL && isProduction)),
  },
  auth: {
    enabled: authEnabled,
    issuer: authEnabled ? process.env.SUPABASE_JWT_ISSUER || `${required('SUPABASE_URL', supabaseUrl)}/auth/v1` : '',
    audience: process.env.SUPABASE_JWT_AUDIENCE || 'authenticated',
  },
}
