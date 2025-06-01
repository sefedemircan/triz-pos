import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type User = Database['public']['Tables']['users']['Row']

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  forceReset: () => void // Emergency reset function
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  
  setLoading: (loading) => set({ loading }),
  
  signOut: async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      set({ user: null, loading: false })
    } catch (error) {
      console.error('Sign out error:', error)
      // Hata durumunda da state'i temizle
      set({ user: null, loading: false })
    }
  },

  forceReset: () => {
    console.log('Force resetting auth state')
    set({ user: null, loading: false })
  }
})) 