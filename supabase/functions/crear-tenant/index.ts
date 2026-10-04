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

    // Cliente admin (service role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
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

    await supabaseAdmin.from('categorias').insert(
      categoriasDefault.map((cat) => ({
        tenant_id: tenantData.id,
        nombre: cat.nombre,
        color: cat.color,
      }))
    )

    return new Response(
      JSON.stringify({
        success: true,
        tenant_id: tenantData.id,
        user_id: userId,
        message: '¡Carnicería registrada con éxito!',
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