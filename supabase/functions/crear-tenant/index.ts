import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      nombre_comercial, 
      email, 
      password, 
      telefono, 
      direccion,
      ruc_nit,
      plan_id 
    } = await req.json()

    // Validaciones básicas
    if (!nombre_comercial || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Usar la URL interna de Kong (API Gateway de Supabase).
    // No usar SUPABASE_URL porque el DNS interno solo resuelve 'kong', no el nombre del contenedor.
    const supabaseAdmin = createClient(
      'http://kong:8000',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Error creando auth user:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = authData.user.id

    // 2. Crear tenant
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 30)

    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        nombre_comercial,
        email_contacto: email,
        telefono: telefono || null,
        direccion: direccion || null,
        ruc_nit: ruc_nit || null,
        plan_id: plan_id || 'basico',
        status: 'trial',
        trial_ends_at: trialEnds.toISOString(),
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creando tenant:', tenantError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: 'Error creando la carnicería: ' + tenantError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Crear usuario en la tabla usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: userId,
        tenant_id: tenantData.id,
        nombre: nombre_comercial,
        email,
        rol: 'admin',
        activo: true,
      })

    if (usuarioError) {
      console.error('Error creando usuario:', usuarioError)
      await supabaseAdmin.from('tenants').delete().eq('id', tenantData.id)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: 'Error creando usuario: ' + usuarioError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Crear categorías por defecto
const categoriasDefault = [
  { nombre: 'Res', color: '#DC2626' },
  { nombre: 'Cerdo', color: '#F59E0B' },
  { nombre: 'Pollo', color: '#FCD34D' },
  { nombre: 'Embutidos', color: '#7C3AED' },
  { nombre: 'Achuras', color: '#059669' },
]

const { data: categoriasCreadas } = await supabaseAdmin
  .from('categorias')
  .insert(
    categoriasDefault.map((cat) => ({
      tenant_id: tenantData.id,
      nombre: cat.nombre,
      color: cat.color,
    }))
  )
  .select()

// 5. Crear productos de ejemplo
// (para que el usuario pueda empezar a vender de inmediato)

// Mapear nombre de categoría a ID
const categoriaMap = new Map(
  (categoriasCreadas || []).map((c) => [c.nombre, c.id])
)

const productosEjemplo = [
  {
    nombre: 'Asado de Tira',
    codigo_barras: 'EJEMPLO001',
    unidad_medida: 'kg',
    precio_compra_kg: 6500,
    precio_venta_kg: 9500,
    stock_actual: 10,
    stock_minimo: 2,
    categoria_nombre: 'Res',
  },
  {
    nombre: 'Bife de Chorizo',
    codigo_barras: 'EJEMPLO002',
    unidad_medida: 'kg',
    precio_compra_kg: 8000,
    precio_venta_kg: 12000,
    stock_actual: 8,
    stock_minimo: 2,
    categoria_nombre: 'Res',
  },
  {
    nombre: 'Milanesa de Nalga',
    codigo_barras: 'EJEMPLO003',
    unidad_medida: 'kg',
    precio_compra_kg: 7000,
    precio_venta_kg: 10500,
    stock_actual: 6,
    stock_minimo: 2,
    categoria_nombre: 'Res',
  },
  {
    nombre: 'Chorizo Parrillero',
    codigo_barras: 'EJEMPLO004',
    unidad_medida: 'kg',
    precio_compra_kg: 3800,
    precio_venta_kg: 5800,
    stock_actual: 5,
    stock_minimo: 1,
    categoria_nombre: 'Embutidos',
  },
  {
    nombre: 'Pollo Entero',
    codigo_barras: 'EJEMPLO005',
    unidad_medida: 'kg',
    precio_compra_kg: 2800,
    precio_venta_kg: 4200,
    stock_actual: 7,
    stock_minimo: 2,
    categoria_nombre: 'Pollo',
  },
]

await supabaseAdmin.from('productos').insert(
  productosEjemplo.map((prod) => ({
    tenant_id: tenantData.id,
    categoria_id: categoriaMap.get(prod.categoria_nombre) || null,
    codigo_barras: prod.codigo_barras,
    nombre: prod.nombre,
    unidad_medida: prod.unidad_medida,
    precio_compra_kg: prod.precio_compra_kg,
    precio_venta_kg: prod.precio_venta_kg,
    stock_actual: prod.stock_actual,
    stock_minimo: prod.stock_minimo,
    activo: true,
  }))
)

return new Response(
  JSON.stringify({
    success: true,
    tenant_id: tenantData.id,
    user_id: userId,
    message: '¡Carnicería registrada con éxito!',
    productos_ejemplo: productosEjemplo.length,
  }),
  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
)
  } catch (err) {
    console.error('Error general:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Error inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})