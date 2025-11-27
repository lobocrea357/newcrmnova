import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno desde dashboard/.env.local
const envPath = join(__dirname, 'dashboard', '.env.local')
console.log('📁 Cargando variables de entorno desde:', envPath)

// Cargar el archivo .env.local
config({ path: envPath })

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN DE SUPABASE')
console.log('=' * 60)

// 1. Verificar si las variables de entorno están disponibles
console.log('\n1. 📋 VARIABLES DE ENTORNO:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Definida' : '❌ No definida')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ No definida')

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('Key (primeros 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...')
}

// 2. Intentar crear cliente con las variables cargadas
console.log('\n2. 🔌 CREANDO CLIENTE DE SUPABASE:')

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables de entorno faltantes')
    console.log('URL presente:', !!supabaseUrl)
    console.log('Key presente:', !!supabaseAnonKey)
    process.exit(1)
  }

  console.log('✅ Variables encontradas, creando cliente...')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // 3. Probar conexión
  console.log('\n3. 🧪 PROBANDO CONEXIÓN:')
  
  const { data, error } = await supabase
    .from('bots')
    .select('id')
    .limit(1)

  if (error) {
    console.error('❌ Error de conexión:', error)
    console.log('Código de error:', error.code)
    console.log('Mensaje:', error.message)
    
    // Verificar si es un problema de autenticación
    if (error.code === 'PGRST301') {
      console.log('💡 Posible problema: La clave anónima no tiene permisos')
    } else if (error.code === 'PGRST116') {
      console.log('💡 Posible problema: La tabla no existe o no es accesible')
    }
  } else {
    console.log('✅ Conexión exitosa')
    console.log('Datos obtenidos:', data)
  }

  // 4. Verificar acceso a diferentes tablas
  console.log('\n4. 🗂️ VERIFICANDO ACCESO A TABLAS:')
  
  const tables = ['bots', 'contacts', 'chats', 'messages', 'workers']
  
  for (const table of tables) {
    try {
      const { count, error: tableError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (tableError) {
        console.log(`❌ ${table}: Error - ${tableError.message}`)
      } else {
        console.log(`✅ ${table}: ${count || 0} registros`)
      }
    } catch (err) {
      console.log(`❌ ${table}: Excepción - ${err.message}`)
    }
  }

  // 5. Verificar autenticación
  console.log('\n5. 🔐 VERIFICANDO AUTENTICACIÓN:')
  
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  
  if (authError) {
    console.log('❌ Error de autenticación:', authError.message)
  } else if (session) {
    console.log('✅ Usuario autenticado:', session.user.email)
  } else {
    console.log('⚠️ No hay sesión activa (usando clave anónima)')
  }

} catch (error) {
  console.error('💥 Error general:', error.message)
}

console.log('\n🎉 VERIFICACIÓN COMPLETADA')
console.log('=' * 60)
