# Carniceria POS

Sistema de punto de venta para una carniceria, construido como monorepo con frontend, backend, base de datos PostgreSQL y un paquete compartido de validaciones y tipos.

El repositorio esta publico para que se pueda ver la calidad del codigo, la arquitectura y las decisiones tecnicas aplicadas en un proyecto real. Fue desarrollado casi sin uso de IA: la IA se uso principalmente como apoyo puntual para consultar, contrastar ideas y buscar documentacion, no como generador principal del codigo.

## Objetivo del proyecto

El sistema resuelve operaciones habituales de caja y gestion comercial:

- Registro de ventas.
- Historial de ventas.
- Gestion de clientes.
- Cuentas corrientes y deudas.
- Registro de gastos.
- Apertura, seguimiento y cierre de caja.
- Generacion de comprobantes y reportes PDF desde el backend.
- Autenticacion con Supabase Auth en los entornos donde esta habilitada.

## Arquitectura

El proyecto esta organizado como un monorepo con npm workspaces:

```txt
.
├── apps/
│   └── frontend/          # Aplicacion web React + Vite
├── packages/
│   └── shared/            # Schemas Zod y tipos compartidos
├── services/
│   ├── backend/           # API Express + TypeScript
│   └── database/          # Scripts SQL de inicializacion
├── supabase/              # Configuracion y migraciones Supabase
├── docker-compose.yml     # PostgreSQL local y PostgreSQL de test
└── docker-compose.prod.yml
```

### Backend

El backend esta hecho con TypeScript, Express, PostgreSQL y Zod. La API esta protegida por middleware de autenticacion para las rutas bajo `/api`, y expone `/health` como endpoint publico de verificacion.

La organizacion principal es por feature:

- `customers`: clientes.
- `sales`: ventas y remitos PDF.
- `sale-details`: detalle de ventas.
- `debts`: cuentas corrientes y pagos.
- `expenses`: gastos.
- `closes`: aperturas, cierres y reportes PDF.

Cada feature separa responsabilidades en rutas, controladores, servicios, repositorios, modelos e interfaces cuando corresponde. La intencion es que la logica de negocio no quede mezclada con Express ni con SQL directo.

### Frontend

El frontend esta construido con React, Vite, TypeScript, React Router, React Query, Axios, React Hook Form, Zod, Tailwind CSS y componentes basados en Radix UI.

La aplicacion esta organizada por features y pantallas:

- Ventas.
- Historial de ventas.
- Gastos.
- Clientes.
- Cuentas corrientes.
- Cierres de caja.
- Login y rutas protegidas.

El cliente HTTP agrega automaticamente el token de Supabase Auth cuando la autenticacion esta habilitada, manteniendo el flujo de sesion separado de las pantallas de negocio.

### Base de datos

El entorno local usa PostgreSQL 16 con Docker. El `docker-compose.yml` define dos bases:

- `db`: base de desarrollo, expuesta en el puerto `5432`.
- `db_test`: base para tests de integracion, expuesta en el puerto `5433`.

Los scripts de inicializacion estan en `services/database/init-scripts` y las migraciones relacionadas con Supabase estan en `supabase/migrations`.

## Zod compartido

Una parte importante del proyecto es el paquete `@carniceria/shared`, ubicado en `packages/shared`.

Este paquete centraliza schemas Zod y tipos inferidos para las entidades principales:

- Clientes.
- Ventas.
- Detalles de venta.
- Gastos.
- Deudas.
- Cierres de caja.

El objetivo es evitar duplicar contratos entre frontend y backend. En lugar de definir validaciones parecidas en dos lugares distintos, ambos lados consumen los mismos schemas base.

Ejemplos de uso:

- El frontend extiende schemas compartidos para formularios, agregando reglas especificas de UI cuando hace falta.
- El backend valida cuerpos, query params y params de Express con middlewares basados en Zod.
- Los tipos TypeScript salen de `z.infer`, reduciendo divergencias entre validacion runtime y tipos de compilacion.

Esto hace que los contratos de datos sean mas faciles de mantener y que los cambios importantes fallen antes, ya sea en compilacion, validacion o tests.

## Testing

El backend tiene una estrategia de testing con Vitest separada entre tests unitarios e integracion.

### Tests unitarios

Los tests unitarios estan en:

```txt
services/backend/src/__tests__/unit
```

Cubren principalmente servicios, rutas y generacion de PDFs con dependencias mockeadas. Estan pensados para verificar reglas de negocio, validaciones de flujo y comportamiento de unidades aisladas sin depender de una base real.

Comando:

```bash
npm run test:unit
```

### Tests de integracion

Los tests de integracion estan en:

```txt
services/backend/src/__tests__/integration
```

Estos tests validan repositorios y acceso real a PostgreSQL. Usan la base `db_test` definida en Docker y cargan variables desde `.env.test`.

El setup de tests:

- Verifica conexion contra la base de test.
- Limpia tablas antes de ejecutar.
- Limpia datos antes de cada test para evitar interferencias.
- Usa `TRUNCATE ... RESTART IDENTITY CASCADE` sobre las tablas principales.

Comando:

```bash
npm run test:integration
```

### Cobertura

Tambien hay soporte para coverage con Vitest:

```bash
npm run test:coverage
```

Y un comando general:

```bash
npm test
```

## Scripts principales

Desde la raiz del monorepo:

```bash
npm run dev
npm run build
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
```

Scripts destacados:

- `npm run dev`: compila el paquete shared y levanta backend + frontend en modo desarrollo.
- `npm run dev:supabase`: levanta backend usando configuracion Supabase y frontend.
- `npm run build`: compila shared, backend y frontend.
- `npm run test:unit`: ejecuta tests unitarios del backend.
- `npm run test:integration`: ejecuta tests de integracion del backend contra PostgreSQL.

## Ejecucion local

Instalar dependencias:

```bash
npm install
```

Levantar PostgreSQL local y base de test:

```bash
docker-compose up
```

Crear los archivos de entorno necesarios para backend y frontend segun el modo de ejecucion. Para produccion hay un ejemplo en:

```txt
.env.production.example
```

Levantar el entorno de desarrollo:

```bash
npm run dev
```

El backend expone:

```txt
GET /health
```

Respuesta esperada:

```json
{ "status": "ok" }
```

## Produccion

El proyecto incluye `docker-compose.prod.yml` con servicios separados para backend y frontend:

- Backend Node/Express en el puerto interno `3004`.
- Frontend servido por Nginx en el puerto interno `80`.
- Healthcheck del backend.
- Variables para API, Supabase y configuracion de autenticacion.

Tambien existe configuracion de Nginx en `deploy/nginx` para despliegue.

## Calidad de codigo

Algunas decisiones que busque cuidar en este proyecto:

- Contratos compartidos con Zod entre frontend y backend.
- Separacion por capas en backend.
- Tests unitarios para logica aislada.
- Tests de integracion reales contra PostgreSQL.
- Limpieza de base entre tests para evitar resultados acoplados al orden de ejecucion.
- Tipado fuerte con TypeScript en todos los workspaces.
- Middlewares dedicados para validacion, errores, request id, seguridad y autenticacion.
- Configuracion de Docker para desarrollo, testing y produccion.

La idea del repositorio es mostrar no solo que la aplicacion funciona, sino tambien como esta pensada internamente: contratos claros, responsabilidades separadas, tests con distintos niveles de confianza y una base preparada para seguir creciendo.
