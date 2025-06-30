import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './supabase'

export function createAuthClient() {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function getAuthenticatedUser() {
  const supabase = createAuthClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function checkAdminPermission(userId: string, userEmail?: string) {
  // Special bypass for walterjonesjr@gmail.com
  if (userEmail === 'walterjonesjr@gmail.com') {
    return true
  }
  
  const supabase = createAuthClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()
    
  if (error || !profile?.is_admin) {
    return false
  }
  
  return true
}