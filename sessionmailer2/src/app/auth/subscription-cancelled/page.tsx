'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, ArrowLeft, CreditCard, HelpCircle } from 'lucide-react';

export default function SubscriptionCancelledPage() {
  const router = useRouter();

  const tryAgain = () => {
    router.push('/auth/signup');
  };

  const goHome = () => {
    router.push('/');
  };

  const contactSupport = () => {
    // You can replace this with your actual support email or contact form
    window.location.href = 'mailto:walterjonesjr@gmail.com?subject=Subscription Help - SessionMailer';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl text-orange-700">
            Subscription Cancelled
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-orange-200 bg-orange-50">
            <XCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              Your PayPal subscription setup was cancelled. No charges were made to your account.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold">What happened?</h3>
            <p className="text-sm text-muted-foreground">
              You cancelled the PayPal subscription process before completing the payment. 
              This is completely normal - you can try again anytime.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">What you're missing:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                Professional email template generation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                Custom branding and styling options
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                Project saving and management
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                Priority customer support
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={tryAgain}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Try Subscribing Again
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={goHome} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              
              <Button variant="outline" onClick={contactSupport} className="w-full">
                <HelpCircle className="h-4 w-4 mr-2" />
                Get Help
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-2">Need assistance?</h4>
            <p className="text-sm text-blue-600">
              If you're having trouble with the payment process or have questions about 
              SessionMailer, we're here to help. Contact our support team anytime.
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your data is safe. We don't store any payment information - 
            all transactions are securely processed by PayPal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}