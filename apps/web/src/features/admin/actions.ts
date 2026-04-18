"use server"

import { createClient } from "@supabase/supabase-js"

export async function crearNegocio(formData: FormData) {
  const nombre = formData.get("nombre") as string
  const slug = formData.get("slug") as string
  const email = formData.get("email") as string

  if (!nombre || !slug || !email) {
    return { success: false, error: "Todos los campos son obligatorios" }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "La configuración interna del servidor está incompleta (falta SUPABASE_SERVICE_ROLE_KEY). Por favor, agrégalo a tu .env.local" }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let negocioId: string | undefined = undefined

  try {
    // 1. Insert into negocios table with RLS bypass (service role)
    const { data: negocioData, error: negocioError } = await supabaseAdmin
      .from("negocios")
      .insert({
        nombre,
        slug,
        modulo_reservas: true,
        modulo_pagos: true,
      })
      .select("id")
      .single()

    if (negocioError) throw new Error(`Error al crear negocio: ${negocioError.message}`)
    
    negocioId = negocioData.id

    // 2. Invite user via Supabase Auth
    const redirectToUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/auth/setup-password`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectToUrl
    })

    if (authError) throw new Error(`Error al invitar administrador: ${authError.message}`)
    if (!authData.user) throw new Error("No se pudo obtener el usuario invitado")

    const userId = authData.user.id

    // 3. Link user to the business with role admin_local
    const { error: roleError } = await supabaseAdmin
      .from("roles_usuario")
      .insert({
        user_id: userId,
        negocio_id: negocioId,
        rol: "admin_local",
      })

    if (roleError) throw new Error(`Error al asignar rol: ${roleError.message}`)

    return { success: true, message: "Negocio creado y administrador invitado exitosamente" }
  } catch (error: any) {
    // Robust rollback: Ensure the business record is deleted if anything fails during the process
    if (negocioId) {
      await supabaseAdmin.from("negocios").delete().eq("id", negocioId)
    }

    return { success: false, error: error.message || "Error interno del servidor" }
  }
}
