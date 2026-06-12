import { app } from './app'
import { config } from './config'

app.listen(config.port, () => {
  console.log(`Backend corriendo en http://localhost:${config.port}`)
})
