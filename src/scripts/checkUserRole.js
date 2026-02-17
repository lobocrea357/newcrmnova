import { supabase } from '../config/supabase.js';

/**
 * Script para verificar el rol actual de los usuarios
 * Útil para diagnosticar problemas de autenticación
 */

async function checkUserRoles() {
  try {
    console.log('🔍 Verificando roles de usuarios...\n');

    // 1. Obtener todos los usuarios de Supabase Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }

    console.log(`📊 Total de usuarios en Auth: ${users.length}\n`);

    // 2. Para cada usuario, verificar su perfil y rol
    for (const user of users) {
      console.log(`👤 Usuario: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Auth Metadata Role: ${user.user_metadata?.role || user.app_metadata?.role || 'sin rol'}`);
      console.log(`   Auth Full Name: ${user.user_metadata?.full_name || 'sin nombre'}`);
      
      // 3. Verificar perfil en la tabla profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          is_active,
          role_id,
          role:roles(
            id,
            name,
            description
          )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log(`   ⚠️ Error en perfil: ${profileError.message}`);
      } else if (profile) {
        console.log(`   ✅ Perfil encontrado:`);
        console.log(`      - Nombre: ${profile.full_name || 'sin nombre'}`);
        console.log(`      - Activo: ${profile.is_active ? 'Sí' : 'No'}`);
        console.log(`      - Role ID: ${profile.role_id || 'sin rol_id'}`);
        console.log(`      - Role Name: ${profile.role?.name || 'sin rol'}`);
        console.log(`      - Role Description: ${profile.role?.description || 'sin descripción'}`);
      } else {
        console.log(`   ❌ No se encontró perfil en la tabla profiles`);
      }
      
      console.log('   ────────────────────────────────────');
    }

    // 4. Verificar roles disponibles en el sistema
    console.log('\n🛡️ Roles disponibles en el sistema:');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (rolesError) {
      console.log('❌ Error obteniendo roles:', rolesError.message);
    } else {
      roles.forEach(role => {
        console.log(`   - ${role.name}: ${role.description || 'sin descripción'}`);
        console.log(`     Permisos: ${Array.isArray(role.permissions) ? role.permissions.length : 0} permisos`);
        if (Array.isArray(role.permissions) && role.permissions.length > 0) {
          console.log(`     Lista: ${role.permissions.join(', ')}`);
        }
      });
    }

    // 5. Diagnóstico final
    console.log('\n🔧 Diagnóstico:');
    const adminUsers = users.filter(user => 
      user.user_metadata?.role === 'admin' || 
      user.app_metadata?.role === 'admin'
    );
    
    console.log(`   - Usuarios con rol 'admin' en Auth: ${adminUsers.length}`);
    
    const usersWithAdminProfile = users.filter(user => {
      const profile = users.find(u => u.id === user.id);
      return profile?.role?.name === 'admin';
    });
    
    console.log(`   - Usuarios con perfil de 'admin': ${usersWithAdminProfile.length}`);

    if (adminUsers.length === 0) {
      console.log('\n⚠️ RECOMENDACIÓN: No hay usuarios con rol de admin en Auth.');
      console.log('   Ejecuta: node src/scripts/fixAdminRole.js');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }
}

// Ejecutar el script
checkUserRoles()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
