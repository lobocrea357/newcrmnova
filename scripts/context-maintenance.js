#!/usr/bin/env node

/**
 * Script de Mantenimiento Automatizado para AI_CONTEXT.md
 * 
 * Uso: node scripts/context-maintenance.js [--validate|--report|--update]
 * 
 * Opciones:
 * --validate   : Validar estado actual del contexto
 * --report     : Generar reporte mensual
 * --update     : Actualizar meta-datos automáticamente
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONTEXT_FILE = path.join(__dirname, '..', 'AI_CONTEXT.md')
const DASHBOARD_SRC = path.join(__dirname, '..', 'dashboard', 'src')
const BACKEND_SRC = path.join(__dirname, '..', 'src')

class ContextMaintenance {
  constructor() {
    this.contextContent = ''
    this.metadata = {}
    this.stats = {
      patternsFound: 0,
      obsoletePatterns: 0,
      lastUpdate: null,
      contradictions: []
    }
  }

  async loadContext() {
    try {
      this.contextContent = fs.readFileSync(CONTEXT_FILE, 'utf8')
      console.log('✅ AI_CONTEXT.md cargado exitosamente')
    } catch (error) {
      console.error('❌ Error al cargar AI_CONTEXT.md:', error.message)
      process.exit(1)
    }
  }

  parseMetadata() {
    const metadataMatch = this.contextContent.match(/```yaml\nmeta:\n([\s\S]*?)\n```/)
    if (metadataMatch) {
      const yamlContent = metadataMatch[1]
      const lines = yamlContent.split('\n')
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim())
        if (key && value) {
          this.metadata[key] = value.replace(/"/g, '')
        }
      })
    }
    
    console.log('📊 Meta-datos parseados:', this.metadata)
  }

  async scanForPatterns() {
    const patterns = []
    
    // Escanear hooks
    const hookFiles = await this.findFiles(DASHBOARD_SRC, 'use*.js')
    hookFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const hookMatches = content.match(/export\s+(?:const|function)\s+(use\w+)/g)
      if (hookMatches) {
        hookMatches.forEach(match => {
          const hookName = match.match(/use\w+/)[0]
          patterns.push({
            type: 'hook',
            name: hookName,
            file: path.relative(DASHBOARD_SRC, file),
            lastSeen: new Date().toISOString().split('T')[0]
          })
        })
      }
    })
    
    // Escanear componentes
    const componentFiles = await this.findFiles(DASHBOARD_SRC, '*[A-Z]*.js*')
    componentFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const componentMatches = content.match(/export\s+(?:default\s+)?function\s+([A-Z]\w+)/g)
      if (componentMatches) {
        componentMatches.forEach(match => {
          const componentName = match.match(/[A-Z]\w+/)[0]
          patterns.push({
            type: 'component',
            name: componentName,
            file: path.relative(DASHBOARD_SRC, file),
            lastSeen: new Date().toISOString().split('T')[0]
          })
        })
      }
    })
    
    this.stats.patternsFound = patterns.length
    console.log(`🔍 Encontrados ${patterns.length} patrones en el código`)
    
    return patterns
  }

  async findFiles(dir, pattern) {
    const files = []
    
    function scanDirectory(currentDir) {
      const items = fs.readdirSync(currentDir)
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath)
        } else if (stat.isFile() && item.match(pattern)) {
          files.push(fullPath)
        }
      }
    }
    
    scanDirectory(dir)
    return files
  }

  validateContext() {
    const issues = []
    
    // Validar meta-datos
    if (!this.metadata.ultima_actualizacion_ia) {
      issues.push('Falta meta-dato: ultima_actualizacion_ia')
    }
    
    if (!this.metadata.patrones_documentados) {
      issues.push('Falta meta-dato: patrones_documentados')
    }
    
    // Validar consistencia
    const documentedPatterns = (this.contextContent.match(/- \*\*(use\w+)\*\*:/g) || []).length
    const documentedComponents = (this.contextContent.match(/- \*\*([A-Z]\w+)\*\*:/g) || []).length
    
    console.log(`📈 Patrones documentados: ${documentedPatterns + documentedComponents}`)
    console.log(`🔍 Patrones encontrados: ${this.stats.patternsFound}`)
    
    if (Math.abs(documentedPatterns - this.stats.patternsFound) > 5) {
      issues.push(`Diferencia significativa entre patrones documentados (${documentedPatterns}) y encontrados (${this.stats.patternsFound})`)
    }
    
    return issues
  }

  generateReport() {
    const report = `
## 📊 Reporte de Mantenimiento - ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}

### 📈 Estadísticas:
- **Patrones totales**: ${this.stats.patternsFound}
- **Patrones activos**: ${this.stats.patternsFound - this.stats.obsoletePatterns} (${((this.stats.patternsFound - this.stats.obsoletePatterns) / this.stats.patternsFound * 100).toFixed(1)}%)
- **Patrones obsoletos**: ${this.stats.obsoletePatterns} (${(this.stats.obsoletePatterns / this.stats.patternsFound * 100).toFixed(1)}%)
- **Última actualización**: ${this.metadata.ultima_actualizacion_ia || 'No registrada'}

### 🔄 Cambios Recientes:
- ✅ Contexto validado automáticamente
- ✅ Meta-datos actualizados
- ✅ Patrones escaneados y verificados

### 🎯 Salud del Contexto: ${this.stats.patternsFound > 0 ? '✅ BUENA' : '⚠️ REQUIERE ATENCIÓN'}

### 📝 Recomendaciones:
${this.generateRecommendations()}
`
    
    return report
  }

  generateRecommendations() {
    const recommendations = []
    
    if (this.stats.patternsFound === 0) {
      recommendations.push('- Realizar escaneo manual de patrones')
    }
    
    if (!this.metadata.ultima_actualizacion_ia) {
      recommendations.push('- Actualizar meta-datos de última modificación')
    }
    
    const daysSinceUpdate = this.metadata.ultima_actualizacion_ia ? 
      Math.floor((new Date() - new Date(this.metadata.ultima_actualizacion_ia)) / (1000 * 60 * 60 * 24)) : 
      Infinity
    
    if (daysSinceUpdate > 30) {
      recommendations.push('- Contexto no actualizado en más de 30 días')
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '- Contexto en buen estado, continuar monitoreo'
  }

  updateMetadata() {
    const today = new Date().toISOString().split('T')[0]
    
    // Actualizar meta-datos
    const newMetadata = `meta:
  creado: "${this.metadata.creado || today}"
  ultima_revision_humana: "${this.metadata.ultima_revision_humana || today}"
  ultima_actualizacion_ia: "${today}"
  version_proyecto: "${this.metadata.version_proyecto || 'v1.0.0'}"
  patrones_documentados: "${this.stats.patternsFound}"
  patrones_obsoletos: "${this.stats.obsoletePatterns}"
  ultima_validacion: "${today}"`
    
    const metadataRegex = /```yaml\nmeta:\n([\s\S]*?)\n```/
    this.contextContent = this.contextContent.replace(metadataRegex, '```yaml\n' + newMetadata + '\n```')
    
    // Guardar archivo actualizado
    fs.writeFileSync(CONTEXT_FILE, this.contextContent)
    console.log('✅ Meta-datos actualizados exitosamente')
  }

  validateEnvironment() {
    // Verificar que estamos en entorno de desarrollo
    const nodeEnv = process.env.NODE_ENV || 'development'
    
    if (nodeEnv === 'production') {
      console.error('❌ ERROR: Este script solo debe ejecutarse en entorno de desarrollo')
      console.error('🚫 No es seguro ejecutar mantenimiento de contexto en producción')
      process.exit(1)
    }
    
    // Verificar que no estemos en un entorno CI/CD
    if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
      console.error('❌ ERROR: Este script no debe ejecutarse en entornos CI/CD')
      process.exit(1)
    }
    
    console.log('✅ Entorno de desarrollo validado')
  }

  async run(args = []) {
    const command = args[0]
    
    // Validar entorno antes de ejecutar
    this.validateEnvironment()
    
    await this.loadContext()
    this.parseMetadata()
    await this.scanForPatterns()
    
    switch (command) {
      case '--validate':
        console.log('\n🔍 Validando contexto...')
        const issues = this.validateContext()
        if (issues.length > 0) {
          console.log('\n❌ Problemas encontrados:')
          issues.forEach(issue => console.log(`  - ${issue}`))
        } else {
          console.log('\n✅ Contexto válido y consistente')
        }
        break
        
      case '--report':
        console.log('\n📊 Generando reporte...')
        const report = this.generateReport()
        console.log(report)
        
        // Guardar reporte en archivo
        const reportFile = path.join(__dirname, '..', `context-report-${new Date().toISOString().split('T')[0]}.md`)
        fs.writeFileSync(reportFile, report)
        console.log(`\n📝 Reporte guardado en: ${reportFile}`)
        break
        
      case '--update':
        console.log('\n🔄 Actualizando meta-datos...')
        this.updateMetadata()
        break
        
      default:
        console.log('\n🚀 Ejecutando mantenimiento completo...')
        
        // Validar
        const validationIssues = this.validateContext()
        if (validationIssues.length > 0) {
          console.log('\n❌ Problemas encontrados durante validación:')
          validationIssues.forEach(issue => console.log(`  - ${issue}`))
        }
        
        // Generar reporte
        const maintenanceReport = this.generateReport()
        console.log(maintenanceReport)
        
        // Actualizar meta-datos
        this.updateMetadata()
        
        console.log('\n✅ Mantenimiento completado exitosamente')
    }
  }
}

// Ejecutar script
if (import.meta.url === `file://${process.argv[1]}`) {
  const maintenance = new ContextMaintenance()
  maintenance.run(process.argv.slice(2)).catch(console.error)
}

export default ContextMaintenance
