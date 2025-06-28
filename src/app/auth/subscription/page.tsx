'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Crown, CheckCircle, AlertCircle } from 'lucide-react'
import SimplePaymentWall from '@/components/SimplePaymentWall'

function SubscriptionContent() {
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

    // Check if user returned from payment
    const paymentParam = searchParams.get('payment')
    if (paymentParam === 'success') {
      setPaymentSuccess(true)
    }

    setLoading(false)
  }, [user, router, searchParams])

  const handleSubscriptionSuccess = (subscriptionId: string) => {
    // Handle successful subscription
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Crown className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="mt-4">Complete Your Subscription</CardTitle>
          <CardDescription>
            Get unlimited access to SessionMailer's powerful features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            userEmail={user?.email || ''}
            userId={user?.id || ''}
            onAccessRequested={handleSubscriptionSuccess}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
} 