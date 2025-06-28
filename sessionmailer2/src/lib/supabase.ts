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
          paypal_customer_id: string | null
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'trial'
          subscription_expires_at: string | null
          trial_ends_at: string | null
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
          paypal_customer_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'trial'
          subscription_expires_at?: string | null
          trial_ends_at?: string | null
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
          paypal_customer_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'trial'
          subscription_expires_at?: string | null
          trial_ends_at?: string | null
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
      subscriptions: {
        Row: {
          id: string
          user_id: string
          paypal_subscription_id: string
          paypal_plan_id: string
          status: 'active' | 'cancelled' | 'suspended' | 'expired' | 'pending'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paypal_subscription_id: string
          paypal_plan_id: string
          status: 'active' | 'cancelled' | 'suspended' | 'expired' | 'pending'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paypal_subscription_id?: string
          paypal_plan_id?: string
          status?: 'active' | 'cancelled' | 'suspended' | 'expired' | 'pending'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          paypal_transaction_id: string
          paypal_payment_id: string | null
          amount_cents: number
          currency: string
          status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded'
          transaction_type: 'subscription_payment' | 'one_time_payment' | 'refund'
          paypal_fee_cents: number
          net_amount_cents: number | null
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          paypal_transaction_id: string
          paypal_payment_id?: string | null
          amount_cents: number
          currency?: string
          status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded'
          transaction_type: 'subscription_payment' | 'one_time_payment' | 'refund'
          paypal_fee_cents?: number
          net_amount_cents?: number | null
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          paypal_transaction_id?: string
          paypal_payment_id?: string | null
          amount_cents?: number
          currency?: string
          status?: 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded'
          transaction_type?: 'subscription_payment' | 'one_time_payment' | 'refund'
          paypal_fee_cents?: number
          net_amount_cents?: number | null
          processed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      subscription_analytics: {
        Row: {
          active_subscriptions: number | null
          cancelled_subscriptions: number | null
          suspended_subscriptions: number | null
          new_subscriptions_30d: number | null
          new_subscriptions_7d: number | null
          cancellations_30d: number | null
        }
      }
      revenue_analytics: {
        Row: {
          revenue_30d_cents: number | null
          revenue_7d_cents: number | null
          total_subscription_revenue_cents: number | null
          transactions_30d: number | null
          avg_transaction_amount_cents: number | null
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

// Type for subscription
export type Subscription = Database['public']['Tables']['subscriptions']['Row']

// Type for payment transaction
export type PaymentTransaction = Database['public']['Tables']['payment_transactions']['Row']

// Type for subscription analytics
export type SubscriptionAnalytics = Database['public']['Views']['subscription_analytics']['Row']

// Type for revenue analytics
export type RevenueAnalytics = Database['public']['Views']['revenue_analytics']['Row']

// Enhanced profile type with subscription fields
export type UserProfile = Database['public']['Tables']['profiles']['Row']