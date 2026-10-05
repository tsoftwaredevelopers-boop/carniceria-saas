# 🥩 Carnicería SaaS

Sistema de Punto de Venta (POS) multitenant para carnicerías. Cada carnicería tiene su propio espacio aislado, productos, ventas, reportes y control de caja.

## ✨ Características

### Para carnicerías (clientes)
- 🛒 **POS completo**: venta por peso, código de barras, cálculo de cambio
- 📦 **Gestión de productos**: categorías, precios, stock, alertas
- 💰 **Turnos/Caja**: apertura, cierre con Corte Z, arqueo
- 🗑️ **Mermas**: registro de pérdidas por vencimiento/mal corte
- 📊 **Reportes**: ventas por día/hora, ranking de productos, ganancias, márgenes
- 🧾 **Ticket imprimible**: formato 80mm para impresora térmica
- 🔒 **Aislamiento total**: cada carnicería ve solo sus datos

### Para el dueño del SaaS
- 👑 **Panel de administración**: gestión de todas las carnicerías
- 💳 **Planes**: Básico / Profesional / Premium
- 📈 **Métricas**: MRR, churn, próximos vencimientos
- 🚫 **Suspensión automática**: bloquea acceso si no pagan
- 🎁 **Onboarding automático**: 5 productos de ejemplo al registrarse

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Estilos | TailwindCSS 4 |
| Estado | Zustand |
| Gráficos | Recharts |
| Base de datos | Supabase (PostgreSQL 17) |
| Autenticación | Supabase Auth |
| Edge Functions | Deno |
| Contenedores | Podman (local) / Docker |
| Package Manager | pnpm |

## 📋 Requisitos Previos

- **Node.js 22+** (con nvm)
- **pnpm** (via corepack)
- **Podman** (o Docker)
- **Supabase CLI**

### Instalación de herramientas (Linux Mint / Ubuntu)

```bash
# Node.js 22 con nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22

# pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Podman
sudo apt update
sudo apt install -y podman podman-docker

# Supabase CLI
npm install -g supabase

##🚀 Instalación
1. Clonar el repositorio
bash
git clone https://github.com/tsoftwaredevelopers-boop/carniceria-saas.git
cd carniceria-saas
2. Configurar Podman
bash
# Activar socket de Podman para tu usuario
systemctl --user enable --now podman.socket

# Configurar DOCKER_HOST
echo 'export DOCKER_HOST="unix:///run/user/$(id -u)/podman/podman.sock"' >> ~/.bashrc
source ~/.bashrc
3. Instalar dependencias
bash
cd apps/pos
pnpm install
4. Crear .env.local
bash
cd apps/pos
nano .env.local
Pegar:

env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<TU_ANON_KEY_DE_SUPABASE_LOCAL>
SUPABASE_SERVICE_ROLE_KEY=<TU_SERVICE_ROLE_KEY_DE_SUPABASE_LOCAL>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
> **Nota:** Las claves `anon` y `service_role` las obtenés ejecutando `npx supabase status` 
> después de arrancar Supabase por primera vez. **NO subas estas claves a GitHub.**
5. Arrancar Supabase
bash
cd ~/carniceria-saas
npx supabase start --ignore-health-check
⏳ La primera vez tarda 3-10 minutos (descarga imágenes).

6. Aplicar migraciones y seed
bash
npx supabase db push --local
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql
7. Arrancar el POS
bash
cd apps/pos
pnpm dev
Abrir: http://localhost:3000

🔑 Credenciales de Prueba
Rol	Email	Password
Super Admin (dueño SaaS)	tsoftwaredevelopers@gmail.com	MiClaveSegura123
Cliente Demo	admin@donpepe.com	demo123456
Cliente Trial	test@test.com	test123456
📁 Estructura del Proyecto
text
carniceria-saas/
├── apps/
│   └── pos/                    # Aplicación Next.js
│       ├── app/                # Rutas (App Router)
│       │   ├── (auth)/         # Login, Registro, Suscripción vencida
│       │   └── (dashboard)/    # POS, Productos, Ventas, Turnos, Mermas, Admin
│       ├── components/         # Componentes React
│       ├── hooks/              # Custom hooks
│       ├── lib/supabase/       # Clientes de Supabase
│       └── stores/             # Estados Zustand
├── supabase/
│   ├── functions/              # Edge Functions (Deno)
│   │   └── crear-tenant/       # Registro de nuevas carnicerías
│   └── migrations/             # Migraciones SQL
└── README.md
🎯 Flujo de Uso
Cliente nuevo (carnicería)
Entra a /registro

Completa el formulario (nombre, email, password)

Elige un plan

Onboarding automático: se crean 5 productos de ejemplo

Abre caja en /turnos

Empieza a vender en /pos

Dueño del SaaS
Entra a /login con tsoftwaredevelopers@gmail.com

Es redirigido a /admin

Ve todas las carnicerías registradas

Puede: cambiar plan, suspender, reactivar, extender trial

Ejecuta "Suspender Vencidos" para bloquear morosos

🐛 Solución de Problemas
Supabase no arranca
bash
cd ~/carniceria-saas
npx supabase stop --no-backup
podman ps -aq --filter "name=supabase" | xargs -r podman rm -f
podman network prune -f
rm -rf supabase/.temp
mkdir -p supabase/snippets
npx supabase start --ignore-health-check
Error "Database connection error" en Edge Functions
El hostname del contenedor de Kong no resuelve. Solución: usar http://kong:8000 en la Edge Function.

Login da "Invalid credentials"
bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql
📚 Documentación Adicional
MANUAL.md - Manual de uso para clientes

DEPLOY.md - Guía de deploy a producción

📄 Licencia
Propietario - Todos los derechos reservados.

Desarrollado con ❤️ para carnicerías 🥩
---

**Desarrollado con ❤️ en Calilegua, Jujuy, Argentina** 🇦🇷