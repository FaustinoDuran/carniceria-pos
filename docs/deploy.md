# Deploy de Carniceria POS

Arquitectura objetivo:

- `app.tudominio.com` sirve el frontend Vite desde un contenedor Nginx.
- `api.tudominio.com` llega al backend Express.
- El servidor solo expone SSH, `80` y `443`.
- Postgres vive en Supabase y no se expone desde el servidor.
- Supabase Auth emite los JWT y el backend los valida antes de `/api`.

## 1. Preparar Supabase

1. Crear el proyecto en Supabase.
2. Habilitar Email/Password en Authentication.
3. Crear al menos un usuario para el negocio.
4. Ejecutar `services/database/migrations/001_initial_schema.sql` en Supabase SQL Editor.
5. Copiar:
   - Project URL: `https://project-ref.supabase.co`
   - Publishable/anon key para el frontend.
   - Connection string de Postgres para el backend.

Usar el pooler de Supabase para producción si la app queda corriendo en un servidor con procesos que se reinician seguido.

## 2. Preparar Variables

En el servidor, crear `.env.production` desde `.env.production.example`.

Valores mínimos:

```env
VITE_API_URL=https://api.tudominio.com
VITE_SUPABASE_URL=https://project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
VITE_SUPABASE_AUTH_ENABLED=true

CORS_ORIGINS=https://app.tudominio.com
DATABASE_URL=postgresql://...
DB_SSL=true
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_AUTH_ENABLED=true
SUPABASE_JWT_AUDIENCE=authenticated
TRUST_PROXY=true
```

No commitear `.env.production`.

## 3. Auditar Nginx Del Servidor

Antes de tocar Nginx:

```bash
sudo ss -tulpn | grep -E ':80|:443'
sudo nginx -T
docker ps
```

Si ya hay Nginx del host escuchando `80/443`, usar `deploy/nginx/carniceria-pos.host.conf` y adaptar los dominios reales.

Si no hay proxy central y se quiere usar Nginx en Docker, usar `docker-compose.proxy.yml` junto con `docker-compose.prod.yml`.

## 4. Deploy Con Nginx Del Host

Construir y levantar contenedores internos:

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Instalar el server block:

```bash
sudo cp deploy/nginx/carniceria-pos.host.conf /etc/nginx/sites-available/carniceria-pos.conf
sudo ln -s /etc/nginx/sites-available/carniceria-pos.conf /etc/nginx/sites-enabled/carniceria-pos.conf
sudo nginx -t
sudo systemctl reload nginx
```

Generar certificados con Certbot según cómo esté configurado el servidor. Si Certbot modifica los server blocks, revisar después con:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Deploy Con Proxy Docker

Usar esta variante solo si no existe Nginx central ocupando `80/443`.

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.proxy.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml -f docker-compose.proxy.yml up -d
```

Los certificados deben existir en `/etc/letsencrypt` o se debe adaptar el volumen del proxy.

## 6. Verificaciones

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -I http://127.0.0.1:8080
curl -I http://127.0.0.1:3000/health
curl -I https://app.tudominio.com
curl -I https://api.tudominio.com/health
```

Validar desde fuera del servidor:

- `https://app.tudominio.com/login` carga.
- Login con usuario Supabase funciona.
- `/api/*` devuelve `401` sin token.
- Registrar una venta funciona.
- Generar remito/cierre en PDF funciona.
- Refrescar `/ventas`, `/clientes` o `/cierres` no da `404`.

Validar puertos:

```bash
sudo ss -tulpn
```

Solo deberían estar públicos SSH, `80` y `443`. Los puertos `3000` y `8080` deben estar ligados a `127.0.0.1`.

## 7. Rollback

```bash
git log --oneline -5
git checkout <commit-anterior>
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100
```

Si el problema está en Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```
