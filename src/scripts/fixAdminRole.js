import { supabase } from '../config/supabase.js';

/**
 * Script para corregir el rol del usuario administrador
 * Este script debe ejecutarse una vez para asegurar que el admin tenga el rol correcto
 */

async function fixAdminRole() {
  try {
    console.log('🔧 Iniciando corrección de rol de administrador...');

    // 1. Obtener el usuario admin de Supabase Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }

    // Buscar el usuario admin (puedes ajustar este criterio según tu caso)
    const adminUser = users.find(user => 
      user.email === 'admin@tuempresa.com' || 
      user.email.includes('admin') ||
      user.user_metadata?.role === 'admin' ||
      user.app_metadata?.role === 'admin'
    );

    if (!adminUser) {
      console.log('❌ No se encontró usuario admin. Por favor, especifica el email del admin.');
      console.log('Usuarios encontrados:');
      users.forEach(user => {
        console.log(`  - ${user.email} (role: ${user.user_metadata?.role || user.app_metadata?.role || 'sin rol'})`);
      });
      return;
    }

    console.log(`✅ Usuario admin encontrado: ${adminUser.email}`);

    // 2. Verificar si existe el rol "admin" en la tabla roles
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'admin')
      .single();

    if (roleError && roleError.code !== 'PGRST116') {
      throw roleError;
    }

    let roleId;
    
    if (!adminRole) {
      // Crear el rol admin si no existe
      console.log('📝 Creando rol "admin"...');
      const { data: newRole, error: createError } = await supabase
        .from('roles')
        .insert({
          name: 'admin',
          description: 'Administrador del sistema con acceso completo',
          permissions: [
            'users.view', 'users.create', 'users.edit', 'users.delete', 'users.activate',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'dashboard.view', 'reports.view',
            'contacts.view', 'contacts.create', 'contacts.edit',
            'messages.view', 'messages.send',
            'bots.view', 'bots.manage',
            'settings.view', 'settings.edit'
          ]
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      roleId = newRole.id;
      console.log('✅ Rol "admin" creado');
    } else {
      roleId = adminRole.id;
      console.log('✅ Rol "admin" ya existe');
    }

    // 3. Actualizar el perfil del usuario con el rol correcto
    console.log('📝 Actualizando perfil del usuario...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.user_metadata?.full_name || adminUser.email.split('@')[0],
        role_id: roleId,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select(`
        id,
        email,
        full_name,
        is_active,
        role:roles(
          id,
          name,
          description
        )
      `)
      .single();

    if (profileError) {
      throw profileError;
    }

    console.log('✅ Perfil actualizado:', profile);

    // 4. Actualizar metadatos del usuario en Supabase Auth
    console.log('📝 Actualizando metadatos del usuario en Auth...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        user_metadata: {
          ...adminUser.user_metadata,
          role: 'admin',
          full_name: adminUser.user_metadata?.full_name || adminUser.email.split('@')[0]
        }
      }
    );

    if (updateError) {
      console.log('⚠️ Error actualizando metadatos Auth:', updateError.message);
      console.log('ℹ️ El perfil fue actualizado, pero los metadatos de Auth no. Esto puede causar inconsistencias.');
    } else {
      console.log('✅ Metadatos de Auth actualizados');
    }

    console.log('🎉 ¡Corrección completada exitosamente!');
    console.log('📋 Resumen:');
    console.log(`  - Usuario: ${adminUser.email}`);
    console.log(`  - Rol asignado: ${profile.role?.name}`);
    console.log(`  - Perfil ID: ${profile.id}`);
    console.log(`  - Rol ID: ${roleId}`);

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    process.exit(1);
  }
}

// Ejecutar el script
fixAdminRole()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
