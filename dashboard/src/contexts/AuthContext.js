'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, handleAuthError } from '@/lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('🔐 Auth state change:', event, session?.user?.email)

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setSession(null)
          if (initialized) {
            router.push('/login')
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session.user)
          setSession(session)
        } else if (event === 'USER_UPDATED') {
          setUser(session.user)
          setSession(session)
        }

        setLoading(false)
        setInitialized(true)
      }
    )

    return () => subscription.unsubscribe()
  }, [router, initialized])

  const getInitialSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        await handleAuthError(error)
        return
      }

      if (session) {
        setUser(session.user)
        setSession(session)
      }
    } catch (error) {
      console.error('❌ Error getting initial session:', error)
      await handleAuthError(error)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      setSession(null)
      router.push('/login')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      await handleAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        await handleAuthError(error)
        return null
      }

      if (data.session) {
        setUser(data.session.user)
        setSession(data.session)
      }

      return data.session
    } catch (error) {
      console.error('❌ Refresh session error:', error)
      await handleAuthError(error)
      return null
    }
  }

  const checkAuthStatus = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        await handleAuthError(error)
        return false
      }

      return !!user
    } catch (error) {
      console.error('❌ Check auth status error:', error)
      await handleAuthError(error)
      return false
    }
  }

  const value = {
    user,
    session,
    loading,
    initialized,
    signIn,
    signOut,
    refreshSession,
    checkAuthStatus,
    isAuthenticated: !!user && !!session,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
