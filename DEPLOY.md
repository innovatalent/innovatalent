# Innova Talent SaaS — Deploy en Railway + Hostinger

## Arquitectura

- **Railway**: Node.js app + PostgreSQL (managed)
- **Hostinger**: DNS del dominio innovatalentlabs.com
- Railway maneja SSL/TLS automáticamente

---

## 1. Subir repo a GitHub

```bash
cd /ruta/al/proyecto
git init
git add -A
git commit -m "Initial commit"
gh repo create innovatalent-saas --private --push
```

## 2. Crear proyecto en Railway

1. Ir a [railway.com](https://railway.com) e iniciar sesión con GitHub
2. Click **New Project** > **Deploy from GitHub Repo**
3. Seleccionar el repo `innovatalent-saas`
4. Railway detecta el Dockerfile y hace build automático

## 3. Agregar PostgreSQL

1. En el proyecto de Railway, click **+ New** > **Database** > **Add PostgreSQL**
2. Railway crea la DB y conecta automáticamente la variable `DATABASE_URL` al servicio

## 4. Configurar variables de entorno

En Railway > tu servicio > **Variables**, agregar:

```
NODE_ENV=production
PORT=4000
APP_URL=https://www.innovatalentlabs.com
FRONTEND_URL=https://www.innovatalentlabs.com

# JWT (generar con: openssl rand -hex 32)
JWT_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<otro-random-64-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Innova Talent <hola@innovatalentlabs.com>

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
GEMINI_API_KEY=<tu-key>
GEMINI_MODEL=gemini-2.0-flash

# Admin
ADMIN_EMAIL=consulting@innovatalentlabs.com
ADMIN_PASSWORD=<contraseña-segura>
```

> `DATABASE_URL` ya la provee Railway automáticamente. No la agregues manualmente.

## 5. Inicializar la base de datos

En Railway > tu servicio > pestaña **Settings** > **Execute Command**:

```bash
node server/src/db/init.js
```

O desde la CLI de Railway:

```bash
railway run node server/src/db/init.js
```

## 6. Conectar dominio en Railway

1. En Railway > tu servicio > **Settings** > **Networking** > **Custom Domain**
2. Agregar: `www.innovatalentlabs.com`
3. Railway te da un valor CNAME (ej: `abc123.up.railway.app`)

## 7. Configurar DNS en Hostinger

Ir a Hostinger > **Dominios** > `innovatalentlabs.com` > **DNS / Nameservers** > **Gestionar DNS**

Borrar los registros A existentes y agregar:

| Tipo   | Nombre | Valor                          | TTL  |
|--------|--------|--------------------------------|------|
| CNAME  | www    | `abc123.up.railway.app`        | 3600 |
| CNAME  | @      | `abc123.up.railway.app`        | 3600 |

> Nota: Algunos registrars no permiten CNAME en `@` (root). Si ese es el caso en Hostinger:
> 1. Usar el CNAME solo para `www`
> 2. Agregar un redirect 301 desde `innovatalentlabs.com` -> `www.innovatalentlabs.com` en Hostinger
> 3. O usar Cloudflare como DNS (permite CNAME flattening en root)

Esperar propagación DNS (5-30 minutos, hasta 24hs máximo).

## 8. Verificar

```bash
curl https://www.innovatalentlabs.com/api/health
# Debería devolver: {"status":"ok","timestamp":"..."}
```

## 9. Configurar Stripe Webhook

Actualizar el endpoint del webhook en Stripe:
```
https://www.innovatalentlabs.com/api/payments/webhook
```

---

## Comandos útiles (Railway CLI)

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Vincular proyecto
railway link

# Ver logs
railway logs

# Ejecutar comando en producción
railway run node server/src/db/init.js

# Deploy manual
railway up

# Variables de entorno
railway variables
```

## Auto-deploy

Railway hace deploy automático cada vez que se pushea a `main` en GitHub.

```bash
git add -A
git commit -m "update"
git push origin main
# Railway deploya automáticamente
```

## Backup de PostgreSQL

```bash
# Desde Railway CLI
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restaurar
railway run psql $DATABASE_URL < backup.sql
```
