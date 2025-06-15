'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  updateProfile: (updates: { full_name?: string }) => Promise<{ error: any }>
  resetAuth: () => void
  isPremium: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('Getting initial session...')
        
        // Quick check if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        console.log('Supabase config check:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          urlStart: supabaseUrl?.substring(0, 20) + '...',
          keyStart: supabaseKey?.substring(0, 20) + '...'
        })
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Supabase environment variables not configured')
          throw new Error('Supabase not configured')
        }
        
        // Add a race condition with timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout after 2 seconds')), 2000)
        )
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        if (!isMounted) return // Component unmounted, don't update state
        
        if (error) {
          console.error('Session error:', error)
          throw error
        }
        
        console.log('Session data:', session ? `User logged in: ${session.user?.email}` : 'No session')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Check if user is premium (with timeout)
          try {
            const profilePromise = supabase
              .from('profiles')
              .select('is_premium')
              .eq('id', session.user.id)
              .single()
            
            const profileTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 1000)
            )
            
            const { data: profile } = await Promise.race([
              profilePromise,
              profileTimeoutPromise
            ]) as any
            
            if (isMounted) {
              setIsPremium(profile?.is_premium ?? false)
            }
          } catch (error) {
            console.warn('Could not fetch premium status:', error)
            if (isMounted) {
              setIsPremium(false)
            }
          }
        } else {
          setIsPremium(false)
        }
      } catch (error) {
        console.error('Auth session error:', error)
        
        if (!isMounted) return
        
        // If it's a timeout error and we're on a protected route, 
        // assume user is authenticated (since middleware allowed access)
        if ((error as Error)?.message?.includes('timeout') && typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          const protectedRoutes = ['/dashboard', '/profile']
          const isOnProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route))
          
          if (isOnProtectedRoute) {
            console.warn('Supabase client timeout, but on protected route - assuming authenticated')
            // Create a minimal user object to indicate authentication
            const fallbackUser = {
              id: 'fallback-user',
              email: 'user@example.com',
              user_metadata: { full_name: 'User' }
            } as any
            
            setUser(fallbackUser)
            setSession({ user: fallbackUser } as any)
            setIsPremium(false)
            setLoading(false)
            return
          }
        }
        
        // Clear any potentially corrupted auth state
        setSession(null)
        setUser(null)
        setIsPremium(false)
        
        // Clear local storage to reset auth state
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('supabase.auth.token')
            sessionStorage.clear()
          } catch (e) {
            console.warn('Could not clear storage:', e)
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    // Cleanup function
    return () => {
      isMounted = false
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        console.log('Auth state change:', event, session ? `User: ${session.user?.email}` : 'No session')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Check if user is premium
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_premium')
              .eq('id', session.user.id)
              .single()
            
            if (isMounted) {
              setIsPremium(profile?.is_premium ?? false)
            }
          } catch (error) {
            console.warn('Could not fetch premium status on auth change:', error)
            if (isMounted) {
              setIsPremium(false)
            }
          }
        } else {
          setIsPremium(false)
        }
        
        if (isMounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...')
      
      // Try to sign out with Supabase with timeout
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      )
      
      await Promise.race([signOutPromise, timeoutPromise])
      console.log('Supabase sign out successful')
    } catch (error) {
      console.warn('Supabase sign out failed, using fallback:', error)
      
      // Fallback: Clear local state and storage manually
      setSession(null)
      setUser(null)
      setIsPremium(false)
      setLoading(false)
      
      // Clear all storage
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear any Supabase-specific storage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.')) {
              localStorage.removeItem(key)
            }
          })
        } catch (e) {
          console.warn('Could not clear storage:', e)
        }
        
        // Force redirect to home page
        window.location.href = '/'
      }
    }
  }

  const resetAuth = () => {
    console.log('Manually resetting auth state...')
    setLoading(false)
    setSession(null)
    setUser(null)
    setIsPremium(false)
    
    // Clear all storage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      
      // Force a page reload to reset everything
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  }

  const updateProfile = async (updates: { full_name?: string }) => {
    if (!user) return { error: new Error('No user logged in') }
    
    // Update auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: updates
    })
    
    if (authError) return { error: authError }
    
    // Update profile table
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    
    return { error: profileError }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updatePassword,
    updateProfile,
    resetAuth,
    isPremium,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 