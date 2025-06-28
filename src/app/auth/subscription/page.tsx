'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Crown, CheckCircle, AlertCircle } from 'lucide-react'
import SimplePaymentWall from '@/components/SimplePaymentWall'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    
    // Check if user returned from PayPal payment
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      setPaymentSuccess(true)
    }
    
    setLoading(false)
  }, [user, router, searchParams])

  const handleSubscriptionSuccess = (subscriptionId: string) => {
    // Redirect to dashboard after successful subscription
    router.push('/dashboard')
  }

  const handleSubscriptionError = (error: string) => {
    setError(`Subscription error: ${error}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signin
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              SessionMailer
            </h1>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Complete Your Subscription</h2>
          <p className="text-muted-foreground">
            Your account is created! Now complete your subscription to access SessionMailer.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {paymentSuccess && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Payment Successful!</strong> Your account will be activated within 24 hours. 
              Walt will review your payment and grant you access to SessionMailer.
            </AlertDescription>
          </Alert>
        )}

        <SimplePaymentWall
          userEmail={user.email || ''}
          userId={user.id}
          onAccessRequested={handleSubscriptionSuccess}
        />

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/auth/signout')}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
} 