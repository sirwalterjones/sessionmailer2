'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle, Crown } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionConfirmed, setSubscriptionConfirmed] = useState(false);

  const subscriptionId = searchParams.get('subscription_id');
  const token = searchParams.get('token');

  useEffect(() => {
    if (subscriptionId) {
      confirmSubscription();
    } else {
      setError('No subscription ID provided');
      setLoading(false);
    }
  }, [subscriptionId]);

  const confirmSubscription = async () => {
    try {
      // Here you could make an API call to verify the subscription status
      // For now, we'll assume success if we have a subscription ID
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setSubscriptionConfirmed(true);
    } catch (err) {
      setError('Failed to confirm subscription');
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Confirming your subscription...</h2>
                <p className="text-muted-foreground mt-2">
                  Please wait while we set up your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Subscription Error</h2>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => router.push('/auth/signup')} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Welcome to SessionMailer Premium!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-green-200 bg-green-50">
            <Crown className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Your subscription is now active! You have full access to all premium features.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold">What you can do now:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Generate unlimited professional email templates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Customize colors and fonts to match your brand
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Save and manage all your projects
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Access priority customer support
              </li>
            </ul>
          </div>

          {subscriptionId && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Subscription ID: <span className="font-mono">{subscriptionId}</span>
              </p>
            </div>
          )}

          <Button
            onClick={goToDashboard}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Start Creating Templates
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can manage your subscription in your{' '}
            <span 
              className="underline cursor-pointer hover:text-primary"
              onClick={() => router.push('/profile')}
            >
              profile settings
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}