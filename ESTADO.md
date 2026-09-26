# Estado del Proyecto Carnicería SaaS

## Última actualización
26/09/2026

## Bloques completados
- [x] Backend Supabase multitenant (9 tablas, RLS, triggers)
- [x] Login multitenant con Supabase Auth
- [x] POS con carrito, código de barras, ticket
- [x] Bloque 2: Turnos/Caja (abrir, cerrar, Corte Z)
- [x] Bloque 1: Robustez del POS (stock visual, scanner, ticket)
- [x] Bloque 3: Mermas (registro, estadísticas, historial)

## Próximo bloque
- [ ] Bloque 4: Reportes (dashboard, gráficos, ganancias)

## Cómo arrancar
\`\`\`bash
~/arrancar.sh
cd ~/carniceria-saas/apps/pos && pnpm dev
\`\`\`

## Credenciales de prueba
- URL: http://localhost:3000
- Email: admin@donpepe.com
- Password: demo123456

## Cuentas
- GitHub: tsoftwaredevelopers-boop
- Repo: https://github.com/tsoftwaredevelopers-boop/carniceria-saas

## Progreso de commits
- a7fab7a - feat: POS multitenant funcional
- 4a2063f - feat: Bloque 2 - Turnos/Caja
- d674ec3 - fix: forzar tema claro
- 9a96c29 - feat: búsqueda por código de barras
- 2f82b3f - feat: Bloque 1 completo - Impresión de ticket
- 5363f8a - feat: Bloque 3 completo - Módulo de Mermas
