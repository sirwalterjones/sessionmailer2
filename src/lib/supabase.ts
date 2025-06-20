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