import { Session } from '@supabase/supabase-js'
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { env } from '@/lib/env'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  authEnabled: boolean
  isAuthenticated: boolean
  isLoading: boolean
  userEmail: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(env.supabaseAuthEnabled)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session)
        setIsLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    authEnabled: env.supabaseAuthEnabled,
    isAuthenticated: !env.supabaseAuthEnabled || Boolean(session),
    isLoading,
    userEmail: session?.user.email ?? null,
    signIn: async (email: string, password: string) => {
      if (!supabase) {
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        throw error
      }
    },
    signOut: async () => {
      if (!supabase) {
        return
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }
    },
  }), [isLoading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
