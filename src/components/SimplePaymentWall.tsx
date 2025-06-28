'use client';

import { useState } from 'react';
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

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('walterjonesjr@gmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email');
    }
  };

  const handlePayPalRedirect = () => {
    // Direct PayPal payment link (no hosted button)
    const paypalUrl = `https://www.paypal.com/paypalme/walterjonesjr@gmail.com?amount=10&note=SessionMailer Monthly Subscription - ${userEmail}`;
    window.open(paypalUrl, '_blank');
  };

  const handleVenmoRedirect = () => {
    // Venmo payment link
    const venmoUrl = `https://venmo.com/u/walterjonesjr?txn=pay&note=SessionMailer Monthly Subscription - ${userEmail}&amount=10`;
    window.open(venmoUrl, '_blank');
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
          $10/month subscription required to use SessionMailer
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">$10<span className="text-lg font-normal text-muted-foreground">/month</span></div>
          <p className="text-sm text-muted-foreground">Professional email templates for photographers</p>
        </div>

        <Separator />

        {/* Payment Options */}
        <div className="space-y-4">
          <h3 className="font-semibold text-center">Choose Your Payment Method:</h3>
          
          {/* PayPal Option */}
          <div className="space-y-2">
            <Button
              onClick={handlePayPalRedirect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pay with PayPal ($10/month)
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure automatic monthly billing
            </p>
          </div>

          <div className="text-center text-sm text-muted-foreground">or</div>

          {/* Venmo Option */}
          <div className="space-y-2">
            <Button
              onClick={handleVenmoRedirect}
              variant="outline"
              className="w-full border-green-200 text-green-700 hover:bg-green-50"
            >
              <span className="font-bold mr-2">V</span>
              Pay with Venmo ($10)
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              One-time payment (you'll need to pay monthly)
            </p>
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