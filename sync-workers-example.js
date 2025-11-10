/**
 * Script de ejemplo para sincronizar workers desde WAHA
 * 
 * Uso:
 * node sync-workers-example.js
 */

const API_URL = 'http://localhost:4000'

// Configuración de workers
// Puedes obtener esta información desde WAHA o configurarla manualmente
const workers = [
  {
    name: 'Moisés',
    email: 'moises@example.com',
    role: 'agent',
    status: 'active',
    phone_number: '+584121234567'
  },
  {
    name: 'Juan Pérez',
    email: 'juan@example.com',
    role: 'agent',
    status: 'active'
  },
  {
    name: 'María García',
    email: 'maria@example.com',
    role: 'supervisor',
    status: 'active'
  }
]

// Asignaciones de bots a workers
const botAssignments = [
  {
    sessionName: 'default',
    workerEmail: 'moises@example.com'
  }
  // Agrega más asignaciones según necesites
]

async function syncWorkers() {
  try {
    console.log('🔄 Sincronizando workers...')
    
    const response = await fetch(`${API_URL}/api/workers/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ workers })
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Workers sincronizados exitosamente')
      console.log(result.results)
    } else {
      console.error('❌ Error al sincronizar workers:', result)
    }

    return result.success
  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

async function assignBots() {
  try {
    console.log('\n🔗 Asignando bots a workers...')
    
    for (const assignment of botAssignments) {
      console.log(`   Asignando ${assignment.sessionName} → ${assignment.workerEmail}`)
      
      const response = await fetch(`${API_URL}/api/workers/assign-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignment)
      })

      const result = await response.json()
      
      if (result.success) {
        console.log(`   ✅ ${assignment.sessionName} asignado correctamente`)
      } else {
        console.error(`   ❌ Error al asignar ${assignment.sessionName}:`, result.error)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function verifyWorkers() {
  try {
    console.log('\n📊 Verificando workers...')
    
    const response = await fetch(`${API_URL}/api/workers`)
    const result = await response.json()
    
    console.log(`\nTotal de workers: ${result.total}`)
    result.workers.forEach(worker => {
      console.log(`  - ${worker.name} (${worker.email}) - ${worker.status}`)
    })
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Ejecutar
async function main() {
  console.log('🚀 Iniciando sincronización de workers\n')
  console.log('API URL:', API_URL)
  console.log('Workers a sincronizar:', workers.length)
  console.log('Asignaciones de bots:', botAssignments.length)
  console.log('\n' + '='.repeat(50) + '\n')

  // 1. Sincronizar workers
  const syncSuccess = await syncWorkers()
  
  if (!syncSuccess) {
    console.error('\n❌ La sincronización falló. Abortando.')
    process.exit(1)
  }

  // 2. Asignar bots
  if (botAssignments.length > 0) {
    await assignBots()
  }

  // 3. Verificar
  await verifyWorkers()

  console.log('\n' + '='.repeat(50))
  console.log('\n✅ Proceso completado')
  console.log('\n📊 Abre el dashboard para ver los cambios:')
  console.log('   http://localhost:3001\n')
}

main().catch(console.error)
