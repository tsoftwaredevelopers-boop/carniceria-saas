# 🚀 Guía de Deploy a Producción

Guía paso a paso para llevar Carnicería SaaS a producción (Supabase Cloud + Vercel).

---

## 📌 Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Crear proyecto en Supabase Cloud](#2-crear-proyecto-en-supabase-cloud)
3. [Migrar la base de datos](#3-migrar-la-base-de-datos)
4. [Deploy de Edge Functions](#4-deploy-de-edge-functions)
5. [Deploy del frontend en Vercel](#5-deploy-del-frontend-en-vercel)
6. [Configurar dominio propio](#6-configurar-dominio-propio)
7. [Configurar pg_cron para suspensión automática](#7-configurar-pg_cron-para-suspensión-automática)
8. [Configurar pagos (futuro)](#8-configurar-pagos-futuro)

---

## 1. Requisitos previos

### Cuentas necesarias

- ✅ **Cuenta de Supabase** → https://supabase.com
- ✅ **Cuenta de GitHub** → https://github.com
- ✅ **Cuenta de Vercel** → https://vercel.com
- ✅ **Dominio propio** (opcional, ej: `carniceria-saas.com`)

### Herramientas locales

- Node.js 22+
- pnpm
- Supabase CLI (ya instalado)
- Vercel CLI (instalar: `npm install -g vercel`)

---

## 2. Crear proyecto en Supabase Cloud

### 2.1. Crear el proyecto

1. Andá a https://supabase.com/dashboard
2. Click en **"New project"**
3. Completá:
   - **Name**: `carniceria-saas-prod`
   - **Database Password**: una contraseña fuerte (guardala)
   - **Region**: `South America (São Paulo)` (para Argentina)
   - **Pricing Plan**: Free (para empezar) o Pro ($25/mes)
4. Click en **"Create new project"**

⏳ Tarda ~2 minutos en crearse.

### 2.2. Guardar las credenciales

Una vez creado, andá a **Settings → API** y copiá:

- **Project URL**: `https://xxx.supabase.co`
- **anon/public key**: `eyJ...`
- **service_role key**: `eyJ...` (⚠️ NUNCA la expongas al frontend)
- **Project Reference ID**: el subdominio de la URL (ej: `xxx`)

### 2.3. Vincular el proyecto local

```bash
cd ~/carniceria-saas
npx supabase link --project-ref TU_PROJECT_REF
Te va a pedir la contraseña del proyecto.

3. Migrar la base de datos
3.1. Aplicar las migraciones
bash
npx supabase db push
Esto va a:

Aplicar todas las migraciones de supabase/migrations/ al proyecto Cloud.

Crear las 9 tablas + 6 vistas + funciones + triggers.

Pégame el resultado y verificá en Supabase Dashboard → Table Editor.

3.2. Aplicar el seed
⚠️ IMPORTANTE: El seed crea datos de prueba. En producción NO lo apliques (o creá un seed específico para producción sin tenants).

Para producción, el seed debería solo:

Insertar los 3 planes (básico, pro, premium).

Modificar el seed para producción:

bash
code supabase/seed.sql
Reemplazar todo el contenido por:

sql
-- ============================================================
-- SEED DE PRODUCCIÓN
-- Solo inserta los planes base. Los tenants se crean vía /registro.
-- ============================================================

INSERT INTO plans (id, nombre, precio_mensual, max_usuarios, max_productos, max_ventas_mensuales, features) VALUES
  ('basico', 'Básico', 1990, 2, 100, 3000, '{"reportes": false, "soporte": "email"}'),
  ('pro', 'Profesional', 3990, 5, 500, 10000, '{"reportes": true, "soporte": "email_prioritario"}'),
  ('premium', 'Premium', 7990, 15, 2000, 50000, '{"reportes": true, "soporte": "telefono", "api": true}')
ON CONFLICT (id) DO NOTHING;

-- Crear el super_admin (vos)
-- ⚠️ IMPORTANTE: Cambiar el email y la contraseña antes de aplicar

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'tsoftwaredevelopers@gmail.com',
  crypt('CAMBIAR_ESTA_CLAVE_EN_PRODUCCION', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '', '', '', ''
) ON CONFLICT (email) DO NOTHING;

-- Crear el tenant interno
INSERT INTO tenants (
  id, nombre_comercial, email_contacto, plan_id, status, es_interno,
  trial_ends_at, current_period_ends_at
) VALUES (
  gen_random_uuid(),
  'Carnicería SaaS - Admin',
  'tsoftwaredevelopers@gmail.com',
  'premium', 'active', true,
  NULL, NULL
) ON CONFLICT DO NOTHING;

-- Crear el usuario admin (vinculado al auth.user)
INSERT INTO usuarios (id, tenant_id, nombre, email, rol, activo)
SELECT 
  au.id,
  (SELECT id FROM tenants WHERE es_interno = true LIMIT 1),
  'Super Admin',
  'tsoftwaredevelopers@gmail.com',
  'super_admin',
  true
FROM auth.users au
WHERE au.email = 'tsoftwaredevelopers@gmail.com'
ON CONFLICT (id) DO NOTHING;
Aplicar:

bash
psql "postgresql://postgres.TU_PROJECT_REF:TU_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" -f supabase/seed.sql
O simplemente insertá los planes y el super_admin desde Supabase Dashboard → SQL Editor.

4. Deploy de Edge Functions
4.1. Configurar variables de entorno en Supabase Cloud
Las Edge Functions necesitan:

SUPABASE_URL (auto-inyectada por Supabase Cloud)

SUPABASE_SERVICE_ROLE_KEY (auto-inyectada)

En Cloud, SUPABASE_URL SÍ funciona (no hay que cambiar por http://kong:8000).

⚠️ IMPORTANTE: El fix del hostname http://kong:8000 es solo para local. En Cloud, la URL interna resuelve automáticamente.

Solución: usar una variable condicional.

Modificar supabase/functions/crear-tenant/index.ts:

typescript
// Usar Kong en local, pero SUPABASE_URL en producción
const supabaseUrl = Deno.env.get('SUPABASE_URL')?.includes('kong')
  ? 'http://kong:8000'
  : Deno.env.get('SUPABASE_URL') ?? ''
O mejor: Usar Deno.env.get('SUPABASE_URL') directamente en producción y comentar el fix local.

4.2. Deploy de la función
bash
npx supabase functions deploy crear-tenant --no-verify-jwt
Verificar:

bash
curl -X POST https://TU_PROJECT_REF.supabase.co/functions/v1/crear-tenant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -d '{"test": true}'
Esperado: {"error":"Faltan campos obligatorios"}

5. Deploy del frontend en Vercel
5.1. Instalar Vercel CLI
bash
npm install -g vercel
5.2. Deploy desde la carpeta del POS
bash
cd ~/carniceria-saas/apps/pos
vercel
Te va a preguntar:

Set up and deploy? → Y

Which scope? → Tu cuenta

Link to existing project? → N

Project name? → carniceria-saas

In which directory is your code located? → ./

Want to modify these settings? → N

Vercel detecta Next.js automáticamente y hace el primer deploy.

5.3. Configurar variables de entorno en Vercel
Andá a Vercel Dashboard → Project → Settings → Environment Variables y agregá:

Nombre	Valor	Environment
NEXT_PUBLIC_SUPABASE_URL	https://TU_PROJECT_REF.supabase.co	Production, Preview, Development
NEXT_PUBLIC_SUPABASE_ANON_KEY	tu_anon_key	Production, Preview, Development
⚠️ NO agregar SUPABASE_SERVICE_ROLE_KEY al frontend. Esa clave solo va en las Edge Functions.

5.4. Redeploy
bash
vercel --prod
6. Configurar dominio propio
6.1. Comprar un dominio
Namecheap: https://namecheap.com

Cloudflare: https://cloudflare.com

Google Domains: https://domains.google

Ejemplo: carniceria-saas.com (~$10/año)

6.2. Configurar en Vercel
Vercel Dashboard → Project → Domains

Agregar carniceria-saas.com

Vercel te da los DNS records:

A record: 76.76.21.21

CNAME record: cname.vercel-dns.com

Configurar en tu registrador de dominio.

⏳ La propagación DNS tarda ~24hs (a veces menos).

6.3. Configurar en Supabase (Auth URLs)
Andá a Supabase Dashboard → Authentication → URL Configuration:

Site URL: https://carniceria-saas.com

Redirect URLs:

https://carniceria-saas.com/**

https://carniceria-saas.vercel.app/**

7. Configurar pg_cron para suspensión automática
pg_cron es una extensión de PostgreSQL que permite programar tareas.

7.1. Habilitar pg_cron en Supabase Cloud
Andá a Supabase Dashboard → Database → Extensions y habilitá pg_cron.

7.2. Programar la suspensión automática
Andá a SQL Editor y ejecutá:

sql
-- Programar suspensión diaria a las 3 AM (hora Argentina)
SELECT cron.schedule(
  'suspender-vencidos-diario',
  '0 3 * * *',
  $$SELECT suspender_tenants_vencidos()$$
);
Verificar:

sql
SELECT * FROM cron.job;
Debería mostrar:

text
jobid | schedule   | command                              | nodename | nodeport | database | username | active
------+------------+--------------------------------------+----------+----------+----------+----------+--------
    1 | 0 3 * * *  | SELECT suspender_tenants_vencidos()  | localhost|     5432 | postgres | postgres | t
¡Listo! Ahora todos los días a las 3 AM se suspenden automáticamente los tenants vencidos.

7.3. Comandos útiles de pg_cron
sql
-- Ver todas las tareas programadas
SELECT * FROM cron.job;

-- Ver el historial de ejecuciones
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Eliminar una tarea
SELECT cron.unschedule('suspender-vencidos-diario');
8. Configurar pagos (futuro)
Actualmente el sistema tiene planes manuales. Para cobrar automáticamente, integrar:

Opción A: Stripe (internacional)
Crear cuenta en https://stripe.com

Crear productos y precios (Básico, Pro, Premium)

Configurar webhook: https://TU_PROJECT_REF.supabase.co/functions/v1/stripe-webhook

Crear Edge Function stripe-webhook que:

Reciba eventos de Stripe (invoice.paid, invoice.payment_failed).

Actualice el status del tenant en la DB.

Opción B: MercadoPago (Argentina)
Crear cuenta en https://mercadopago.com.ar

Crear suscripciones (preapproval)

Configurar webhook

Crear Edge Function mercadopago-webhook

Documentación futura. Por ahora, cobro manual por transferencia/efectivo.

✅ Checklist de Deploy
Antes de considerar el sistema en producción:

□ Proyecto creado en Supabase Cloud
□ Migraciones aplicadas (npx supabase db push)
□ Planes insertados en la DB
□ Super admin creado
□ Edge Function crear-tenant deployada
□ Frontend deployado en Vercel
□ Variables de entorno configuradas en Vercel
□ Dominio propio configurado
□ Auth URLs configuradas en Supabase
□ pg_cron habilitado y programado
□ Cambiada la contraseña del super_admin
□ Eliminada cualquier credencial de prueba del código
□ Backup automático de la DB configurado (Supabase lo hace por defecto)
🐛 Problemas comunes
Error "Database connection error" en Edge Functions
En Cloud, SUPABASE_URL resuelve automáticamente. No usar http://kong:8000 en producción.

Error "No se puede conectar a Supabase"
Verificar variables de entorno en Vercel.

Error "Invalid JWT" en el frontend
Verificar que NEXT_PUBLIC_SUPABASE_ANON_KEY sea la correcta.

RLS no funciona
Verificar que las políticas estén activas en Supabase Dashboard → Authentication → Policies.

📚 Recursos
Supabase Docs

Vercel Docs

Next.js Docs

pg_cron Docs

¡Buena suerte con el deploy! 🚀

