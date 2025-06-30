'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Crown,
  Mail,
  Copy,
  ExternalLink
} from 'lucide-react';

interface SimplePaymentWallProps {
  userEmail: string;
  userId: string;
  onAccessRequested?: (subscriptionId: string) => void;
}

export default function SimplePaymentWall({ userEmail, userId, onAccessRequested }: SimplePaymentWallProps) {
  const [paymentConfirmation, setPaymentConfirmation] = useState('');
  const [accessRequested, setAccessRequested] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  // Load PayPal SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.paypal) {
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=BAAmuN94_v2zr0Yp_fwhXxaML0nV1hz1xnBqJ1e63TCd9Y4-slb-3b9nqqpqPZRVRmqovfa0I9VwvWQ0Zo&components=hosted-buttons&enable-funding=venmo&currency=USD';
      script.async = true;
      script.onload = () => {
        setPaypalLoaded(true);
        initializePayPalButton();
      };
      document.body.appendChild(script);
    } else if (window.paypal) {
      setPaypalLoaded(true);
      initializePayPalButton();
    }
  }, []);

  const initializePayPalButton = () => {
    if (window.paypal && document.getElementById('paypal-button-container')) {
      window.paypal.HostedButtons({
        hostedButtonId: "4NN6A85J736E2"
      }).render("#paypal-button-container");
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('walterjonesjr@gmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email');
    }
  };

  const requestAccess = async () => {
    // Simple API call to request access
    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          paymentConfirmation: paymentConfirmation.trim() || 'No payment details provided',
          requestedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        setAccessRequested(true);
        // Pass the payment confirmation as the subscription ID
        onAccessRequested?.(paymentConfirmation || 'pending');
      } else {
        alert('Failed to submit access request. Please try again.');
      }
    } catch (error) {
      alert('Failed to submit access request. Please try again.');
    }
  };

  if (accessRequested) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl text-yellow-700">Access Request Submitted</CardTitle>
          <CardDescription>
            Your payment details have been submitted for review
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Walt will review your payment and activate your account within 24 hours. You'll receive an email confirmation.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            If you have any questions, email walterjonesjr@gmail.com
          </p>
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
        <CardTitle className="text-2xl">SessionMailer Access</CardTitle>
        <CardDescription>
          $10 payment required to access SessionMailer
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">$10<span className="text-lg font-normal text-muted-foreground"> one-time</span></div>
          <p className="text-sm text-muted-foreground">Lifetime access to professional email templates</p>
        </div>

        <Separator />

        {/* Payment Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-center">Complete Your Payment:</h3>
          
          {/* PayPal Button Container */}
          <div className="space-y-2">
            <div id="paypal-button-container" className="w-full">
              {!paypalLoaded && (
                <Button 
                  disabled 
                  className="w-full bg-blue-600 text-white"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Loading PayPal...
                </Button>
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Secure $10 payment via PayPal
            </p>
          </div>
          
          {/* Manual Payment Option */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Or send manually:</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">walterjonesjr@gmail.com</code>
              <Button
                onClick={copyEmail}
                variant="outline"
                size="sm"
              >
                <Copy className="h-3 w-3" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Send $10 with note: "SessionMailer - {userEmail}"</p>
          </div>
        </div>

        <Separator />

        {/* Confirmation Section */}
        <div className="space-y-3">
          <Input
            placeholder="Optional: Enter payment details or transaction ID"
            value={paymentConfirmation}
            onChange={(e) => setPaymentConfirmation(e.target.value)}
          />
          <Button
            onClick={requestAccess}
            className="w-full"
          >
            Request Access
          </Button>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">What you get:</h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Unlimited email template generation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Custom styling and branding
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Save and manage projects
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Direct support from Walt
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}