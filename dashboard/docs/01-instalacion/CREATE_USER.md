# 👤 Crear Usuario para el Dashboard

## Método 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. En el menú lateral, haz clic en **Authentication** (🔐)
3. Haz clic en la pestaña **Users**
4. Haz clic en el botón **Add User** (arriba a la derecha)
5. Selecciona **Create new user**
6. Completa el formulario:
   ```
   Email: admin@viajesnovabot.com
   Password: TuContraseñaSegura123!
   ```
7. ✅ **IMPORTANTE**: Marca la casilla **Auto Confirm User**
8. Haz clic en **Create user**

## Método 2: Desde SQL Editor

Si prefieres usar SQL, puedes ejecutar esto en el SQL Editor de Supabase:

```sql
-- Nota: Este método requiere que tengas configurado el servicio de Auth
-- Es más fácil usar el método 1 (Dashboard)

-- Insertar usuario en auth.users (requiere permisos especiales)
-- Mejor usar el dashboard de Supabase para crear usuarios
```

## Método 3: Registro desde la Aplicación (Opcional)

Si quieres permitir que los usuarios se registren, puedes crear una página de registro:

### Crear página de registro

Crea el archivo `src/app/register/page.js`:

```jsx
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserPlus, Mail, Lock } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Regístrate para acceder al dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">
                ¡Cuenta creada! Redirigiendo al login...
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Correo electrónico"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Agregar link en la página de login

Edita `src/app/login/page.js` y agrega al final:

```jsx
<div className="text-center text-sm text-gray-600">
  <p>
    ¿No tienes cuenta?{' '}
    <a href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
      Regístrate aquí
    </a>
  </p>
</div>
```

## 🔐 Configurar Email de Confirmación (Opcional)

Por defecto, Supabase requiere que los usuarios confirmen su email. Para desarrollo, puedes deshabilitarlo:

1. Ve a **Authentication** > **Settings** en Supabase
2. Busca **Email Confirmations**
3. Desmarca **Enable email confirmations**
4. Guarda los cambios

## ✅ Verificar que el Usuario Funciona

1. Ve a http://localhost:3000/login
2. Ingresa el email y contraseña que creaste
3. Haz clic en **Iniciar Sesión**
4. Deberías ser redirigido a `/dashboard`

## 🚨 Solución de Problemas

### Error: "Invalid login credentials"
- Verifica que el email y contraseña son correctos
- Verifica que el usuario está confirmado en Supabase
- Verifica que el usuario existe en la tabla `auth.users`

### Error: "Email not confirmed"
- Ve a Authentication > Users en Supabase
- Busca el usuario
- Haz clic en los 3 puntos > **Confirm email**

### No puedo crear usuarios desde el dashboard
- Verifica que tienes permisos de administrador en Supabase
- Usa el método 1 (Dashboard de Supabase) que siempre funciona

## 📝 Credenciales de Ejemplo

Para desarrollo, puedes usar:

```
Email: admin@viajesnovabot.com
Password: Admin123!
```

**⚠️ IMPORTANTE**: Cambia estas credenciales en producción!

## 🔒 Mejores Prácticas de Seguridad

1. **Contraseñas fuertes**: Mínimo 8 caracteres, con mayúsculas, minúsculas, números y símbolos
2. **No compartir credenciales**: Cada usuario debe tener su propia cuenta
3. **Habilitar 2FA**: Considera habilitar autenticación de dos factores en Supabase
4. **Revisar logs**: Revisa regularmente los logs de autenticación en Supabase
5. **Políticas RLS**: Configura Row Level Security en Supabase para proteger los datos

## 🎯 Próximos Pasos

Una vez que tengas un usuario creado:

1. ✅ Inicia sesión en el dashboard
2. ✅ Verifica que puedes ver los bots
3. ✅ Explora las conversaciones
4. ✅ Prueba las descargas en TXT y Markdown
5. ✅ Crea más usuarios si es necesario
