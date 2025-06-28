import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_premium: boolean
          is_admin: boolean
          payment_status: 'unpaid' | 'paid' | 'pending_review'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          is_admin?: boolean
          payment_status?: 'unpaid' | 'paid' | 'pending_review'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          is_admin?: boolean
          payment_status?: 'unpaid' | 'paid' | 'pending_review'
          created_at?: string
          updated_at?: string
        }
      }
      saved_projects: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          email_html: string
          customization: any | null
          share_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          email_html: string
          customization?: any | null
          share_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          email_html?: string
          customization?: any | null
          share_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      access_requests: {
        Row: {
          id: string
          user_id: string
          user_email: string
          payment_confirmation: string
          status: 'pending' | 'approved' | 'rejected'
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          payment_confirmation: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          payment_confirmation?: string
          status?: 'pending' | 'approved' | 'rejected'
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          admin_notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      // No complex views needed for simple approach
    }
  }
}

// Type for project customization settings
export type ProjectCustomization = {
  primaryColor: string
  secondaryColor: string
  headingTextColor: string
  paragraphTextColor: string
  headingFont: string
  paragraphFont: string
  headingFontSize: number
  paragraphFontSize: number
  selectedHeroImage?: string | null // Legacy support
  sessionHeroImages?: Record<string, string> // New per-session hero images
}

// Type for saved project
export type SavedProject = Database['public']['Tables']['saved_projects']['Row']

// Type for access request
export type AccessRequest = Database['public']['Tables']['access_requests']['Row']

// Type for user profile
export type UserProfile = Database['public']['Tables']['profiles']['Row']