import express from 'express'
import { config } from './config'

export const app = express()

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(config.port, () => {
  console.log(`Backend corriendo en http://localhost:${config.port}`)
})