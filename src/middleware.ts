import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile']
    const adminRoutes = ['/admin']
    const authRoutes = ['/auth/signin', '/auth/signup']
    const paymentRoutes = ['/auth/subscription', '/auth/payment']
    
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    const isAdminRoute = adminRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    const isAuthRoute = authRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    const isPaymentRoute = paymentRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Redirect unauthenticated users from protected routes to signin
    if ((isProtectedRoute || isAdminRoute) && !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Check payment status for protected routes (except admin routes and payment routes)
    if (isProtectedRoute && user && !isAdminRoute && !isPaymentRoute) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium, payment_status, email')
          .eq('id', user.id)
          .single()
        
        // Allow access if user is premium, has paid, or is the exempt user
        const hasAccess = profile && (
          profile.is_premium === true || 
          profile.payment_status === 'paid' ||
          profile.email === 'walterjonesjr@gmail.com' // Exempt user
        )
        
        if (!hasAccess) {
          // Redirect to payment page instead of signup to avoid redirect loop
          return NextResponse.redirect(new URL('/auth/subscription', request.url))
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
        // On error, allow access to prevent breaking the app
        return response
      }
    }

    // Check admin permission for admin routes
    if (isAdminRoute && user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        if (!profile?.is_admin) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Admins always get access (they can manage their own payments)
      } catch (error) {
        console.error('Error checking admin status:', error)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Redirect authenticated users from auth routes to dashboard (but not payment routes)
    if (isAuthRoute && user && !isPaymentRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error with auth check, allow the request to proceed
    // This prevents the app from breaking if Supabase is temporarily unavailable
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 