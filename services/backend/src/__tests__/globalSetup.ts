import * as dotenv from 'dotenv'

// Esto se ejecuta antes que nada para poder cargar las variables de entorno
// para los tests en el pool antes que se cargue las de desarrollo.
export default function globalSetup() {
    dotenv.config({ path: '.env.test' })
    console.log('Variables de entorno cargadas para tests (globalSetup)')
}