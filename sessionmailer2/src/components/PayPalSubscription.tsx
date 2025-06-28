'use client';

import { useState, useEffect } from 'react';
import { loadScript } from '@paypal/paypal-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Crown,
  Zap,
  Clock
} from 'lucide-react';

interface PayPalSubscriptionProps {
  userEmail: string;
  userId: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function PayPalSubscription({ 
  userEmail, 
  userId, 
  onSuccess, 
  onError, 
  onCancel 
}: PayPalSubscriptionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    loadPayPalScript();
    checkCurrentSubscription();
  }, []);

  const loadPayPalScript = async () => {
    try {
      const paypal = await loadScript({
        'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        vault: true,
        intent: 'subscription'
      });
      
      if (paypal) {
        setPaypalLoaded(true);
      } else {
        setError('Failed to load PayPal SDK');
      }
    } catch (err) {
      setError('Failed to initialize PayPal');
      console.error('PayPal initialization error:', err);
    }
  };

  const checkCurrentSubscription = async () => {
    try {
      const response = await fetch(`/api/paypal/create-subscription?userId=${userId}`);
      const data = await response.json();
      
      if (data.subscription) {
        setCurrentSubscription(data);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  const createSubscription = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          userId,
          returnUrl: `${window.location.origin}/auth/subscription-success`,
          cancelUrl: `${window.location.origin}/auth/subscription-cancelled`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Redirect to PayPal for approval
      window.location.href = data.approvalUrl;
      
    } catch (err: any) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentSubscription?.hasActiveSubscription) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-700">Active Subscription</CardTitle>
          <CardDescription>
            You already have an active SessionMailer subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Crown className="h-3 w-3 mr-1" />
              Premium Member
            </Badge>
            <p className="text-sm text-muted-foreground">
              Status: {currentSubscription.profile.subscription_status}
            </p>
            {currentSubscription.profile.subscription_expires_at && (
              <p className="text-sm text-muted-foreground">
                Next billing: {new Date(currentSubscription.profile.subscription_expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button 
            className="w-full" 
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">SessionMailer Premium</CardTitle>
        <CardDescription>
          Professional email templates for photographers
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">$10<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          <p className="text-sm text-muted-foreground">Billed monthly to {userEmail}</p>
        </div>

        <Separator />

        {/* Features */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            What's included:
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              Unlimited email template generation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              Custom color and font styling
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              Save and manage projects
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              Professional email templates
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              Priority customer support
            </li>
          </ul>
        </div>

        <Separator />

        {/* Security & Billing Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Secure payment processing by PayPal
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Cancel anytime, no long-term commitment
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Automatic monthly billing
          </div>
        </div>

        {/* Subscribe Button */}
        <Button
          onClick={createSubscription}
          disabled={loading || !paypalLoaded}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating subscription...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe with PayPal
            </>
          )}
        </Button>

        {/* Cancel option */}
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full"
            disabled={loading}
          >
            Maybe later
          </Button>
        )}

        {/* Terms */}
        <p className="text-xs text-center text-muted-foreground">
          By subscribing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-primary">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </a>
        </p>
      </CardContent>
    </Card>
  );
}