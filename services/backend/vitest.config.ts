import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    globals: true,  //nos permite usar vitest sin importar el scope
    globalSetup: './src/__tests__/globalSetup.ts', //Le decimos que ejecute el setup antes de cualquier import para cargar las variables de entorno de test 
    setupFiles: ['./src/__tests__/setup.ts'],//Le decimos que ejecute el setup después de cargar las variables de entorno para verificar la conexión a la DB y cerrar el pool al finalizar los tests
  }
})