# Innova Talent SaaS — Guía de Deploy en VPS Hostinger

## 1. Requisitos en el VPS

Conectate por SSH a tu VPS Hostinger:

```bash
ssh root@TU_IP_VPS
```

Instalar Docker + Docker Compose:

```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin
```

Instalar Git:

```bash
apt install -y git
```

## 2. Clonar el proyecto

```bash
cd /opt
git clone https://github.com/innovatalent/innovatalent-saas.git
cd innovatalent-saas
```

## 3. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

**OBLIGATORIO cambiar:**
- `DB_PASSWORD` → contraseña segura
- `JWT_SECRET` → string random de 64 caracteres
- `JWT_REFRESH_SECRET` → otro string random de 64 caracteres
- `ADMIN_EMAIL` → tu email
- `ADMIN_PASSWORD` → tu contraseña de admin
- `APP_URL` → https://innovatalentlabs.com
- `FRONTEND_URL` → https://innovatalentlabs.com

**Para APIs externas (configurar después):**
- `RESEND_API_KEY` → registrate en resend.com
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` → para WhatsApp
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_ID` → para pagos
- `ANTHROPIC_API_KEY` → para el chat IA

Generar secrets aleatorios:
```bash
openssl rand -hex 32   # para JWT_SECRET
openssl rand -hex 32   # para JWT_REFRESH_SECRET
```

## 4. SSL con Let's Encrypt (primera vez)

Antes del primer deploy, obtener el certificado:

```bash
# Crear directorio para SSL
mkdir -p nginx/ssl

# Temporalmente levantar nginx sin SSL para validar dominio
# Editar nginx/default.conf: comentar el bloque server:443 y las líneas ssl_*
# Luego:
docker compose up -d nginx

# Obtener certificado
docker compose run --rm certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  -d innovatalentlabs.com -d www.innovatalentlabs.com \
  --email consulting@innovatalentlabs.com --agree-tos --no-eff-email

# Restaurar nginx/default.conf original
docker compose down
```

## 5. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

## 6. Conectar dominio

En tu panel de Hostinger o tu registrar de dominio:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | IP_DE_TU_VPS |
| A | www | IP_DE_TU_VPS |

Esperar propagación DNS (hasta 24hs, usualmente 5-15 min).

## 7. Configurar Stripe

1. Crear cuenta en stripe.com
2. Crear un Producto "Membresía Starter" con precio $10/mes
3. Copiar el `price_id` a `.env` → `STRIPE_PRICE_ID`
4. Copiar tu `Secret key` a `.env` → `STRIPE_SECRET_KEY`
5. Crear Webhook endpoint: `https://innovatalentlabs.com/api/payments/webhook`
   - Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
6. Copiar el Webhook secret a `.env` → `STRIPE_WEBHOOK_SECRET`

## 8. Configurar Resend (emails)

1. Registrate en resend.com
2. Verificar dominio `innovatalentlabs.com`
3. Copiar API key a `.env` → `RESEND_API_KEY`

## 9. Configurar WhatsApp (Twilio)

1. Crear cuenta en twilio.com
2. Activar WhatsApp sandbox o API
3. Copiar credenciales a `.env`

## 10. Configurar IA (Claude)

1. Obtener API key en console.anthropic.com
2. Copiar a `.env` → `ANTHROPIC_API_KEY`

## 11. Comandos útiles

```bash
# Ver logs
docker compose logs -f app

# Reiniciar
docker compose restart app

# Reinicializar DB (borra todo)
docker compose exec app node server/src/db/init.js

# Backup de la base de datos
docker compose exec postgres pg_dump -U innovatalent_user innovatalent > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup.sql | docker compose exec -T postgres psql -U innovatalent_user innovatalent

# Renovar SSL
docker compose run --rm certbot renew
docker compose restart nginx
```

## 12. Escalar

Para escalar el proyecto:

1. **Más tráfico**: Subir el plan de VPS en Hostinger (más RAM/CPU)
2. **Base de datos dedicada**: Migrar PostgreSQL a un servicio managed (Supabase, Neon, RDS)
3. **CDN**: Agregar Cloudflare delante del dominio
4. **Monitoreo**: Agregar Uptime Robot o Better Stack
5. **CI/CD**: Configurar GitHub Actions para auto-deploy en push a main
6. **Separar frontend**: Migrar a React/Next.js build con Vercel
