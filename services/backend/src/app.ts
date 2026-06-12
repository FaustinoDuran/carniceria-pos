import express from 'express'
import cors, { CorsOptions } from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { apiRouter } from './routes'
import { errorHandler, notFoundHandler } from './http/middlewares/error.middleware'
import { requestId } from './http/middlewares/requestId.middleware'
import { requireAuth } from './http/middlewares/auth.middleware'

export const app = express()

app.set('trust proxy', config.trustProxy)

const corsOptions: CorsOptions = {
  origin: config.cors.allowedOrigins.length > 0 ? config.cors.allowedOrigins : false,
}

app.use(requestId)
app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', requireAuth)
app.use('/api', apiRouter)
app.use(notFoundHandler)
app.use(errorHandler)
