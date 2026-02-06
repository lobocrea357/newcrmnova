'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    const testResults = []

    // Test 1: Basic React rendering
    testResults.push({
      name: 'React Rendering',
      status: 'success',
      message: 'React is rendering correctly'
    })

    // Test 2: Environment variables
    try {
      const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      testResults.push({
        name: 'Environment Variables',
        status: hasSupabaseUrl && hasSupabaseKey ? 'success' : 'error',
        message: `SUPABASE_URL: ${hasSupabaseUrl ? '✅' : '❌'}, SUPABASE_KEY: ${hasSupabaseKey ? '✅' : '❌'}`
      })
    } catch (error) {
      testResults.push({
        name: 'Environment Variables',
        status: 'error',
        message: error.message
      })
    }

    // Test 3: Supabase client
    try {
      const { data, error } = await supabase.auth.getSession()
      testResults.push({
        name: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Supabase client initialized successfully'
      })
    } catch (error) {
      testResults.push({
        name: 'Supabase Connection',
        status: 'error',
        message: error.message
      })
    }

    // Test 4: Database access
    try {
      const { data, error } = await supabase
        .from('bots')
        .select('id')
        .limit(1)

      testResults.push({
        name: 'Database Access',
        status: error ? 'warning' : 'success',
        message: error ? `Database error: ${error.message}` : 'Database accessible'
      })
    } catch (error) {
      testResults.push({
        name: 'Database Access',
        status: 'error',
        message: error.message
      })
    }

    // Test 5: API routes
    try {
      const response = await fetch('/api/health')
      testResults.push({
        name: 'API Routes',
        status: response.ok ? 'success' : 'warning',
        message: `Health API returned: ${response.status}`
      })
    } catch (error) {
      testResults.push({
        name: 'API Routes',
        status: 'error',
        message: error.message
      })
    }

    setTests(testResults)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 Diagnóstico del Sistema</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🔧 Diagnóstico del Sistema</h1>
          <p className="text-gray-600 mt-2">
            Pruebas básicas para identificar problemas en la aplicación
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Resultados de las Pruebas</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {tests.map((test, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`
                      w-3 h-3 rounded-full mr-3
                      ${test.status === 'success' ? 'bg-green-500' :
                        test.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}
                    `}></div>
                    <h3 className="text-sm font-medium text-gray-900">{test.name}</h3>
                  </div>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    ${test.status === 'success' ? 'bg-green-100 text-green-800' :
                      test.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}
                  `}>
                    {test.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 ml-6">{test.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Información del Sistema
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>• Timestamp: {new Date().toISOString()}</p>
                <p>• User Agent: {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 100) + '...' : 'Server Side'}</p>
                <p>• URL: {typeof window !== 'undefined' ? window.location.href : 'Server Side'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Recargar Diagnóstico
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🔑 Ir al Login
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🏠 Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
