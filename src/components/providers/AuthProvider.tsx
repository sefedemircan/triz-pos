'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: UserProfile | null
  authUser: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setAuthUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const createFallbackUser = (authUser: User): UserProfile => {
    return {
      id: authUser.id,
      email: authUser.email!,
      role: (authUser.user_metadata?.role || 'garson') as 'admin' | 'garson' | 'mutfak',
      full_name: authUser.user_metadata?.full_name || 
                authUser.email?.split('@')[0] || 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    console.log('🔄 AuthProvider initializing...')

    // AGRESIF TIMEOUT - 2 saniye sonra her şeyi durdur
    const globalTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('🚨 GLOBAL TIMEOUT - Forcing app to work')
        if (authUser) {
          console.log('⚠️ Using fallback user due to global timeout')
          setUser(createFallbackUser(authUser))
        }
        setLoading(false)
      }
    }, 2000)

    const clearGlobalTimeout = () => {
      if (globalTimeout) {
        clearTimeout(globalTimeout)
      }
    }

    // Basit session check
    const checkSession = async () => {
      try {
        console.log('🔍 Checking session...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          console.log('✅ Session found:', session.user.email)
          setAuthUser(session.user)
          
          // Profile'i hızlı getir
          const fetchProfile = async () => {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (data && !error && mounted) {
                console.log('✅ Profile loaded')
                clearGlobalTimeout()
                setUser(data)
                setLoading(false)
              }
            } catch {
              console.log('⚠️ Profile failed, will use fallback')
            }
          }
          
          fetchProfile()
        } else {
          console.log('ℹ️ No session')
          clearGlobalTimeout()
          setLoading(false)
        }
      } catch (error) {
        console.log('⚠️ Session check failed:', error)
      }
    }

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth event:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session?.user && mounted) {
        setAuthUser(session.user)
        
        // Profile getir
        const fetchSignInProfile = async () => {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (data && !error && mounted) {
              clearGlobalTimeout()
              setUser(data)
              setLoading(false)
            } else {
              console.log('⚠️ Using fallback for sign in')
              clearGlobalTimeout()
              setUser(createFallbackUser(session.user))
              setLoading(false)
            }
          } catch {
            console.log('⚠️ Profile error, using fallback')
            clearGlobalTimeout()
            setUser(createFallbackUser(session.user))
            setLoading(false)
          }
        }
        
        fetchSignInProfile()
      } else if (event === 'SIGNED_OUT') {
        clearGlobalTimeout()
        setAuthUser(null)
        setUser(null)
        setLoading(false)
      }
    })

    checkSession()

    return () => {
      mounted = false
      clearGlobalTimeout()
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, authUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
} 