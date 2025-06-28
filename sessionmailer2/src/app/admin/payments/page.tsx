'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Clock, RefreshCw, Eye } from 'lucide-react';

interface AccessRequest {
  id: string;
  user_email: string;
  payment_confirmation: string;
  status: string;
  requested_at: string;
  created_at: string;
}

export default function PaymentApprovalsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/request-access?admin=true');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'approve' })
      });

      if (response.ok) {
        // Remove from pending list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        alert('Access approved! User has been granted premium access.');
      } else {
        alert('Failed to approve request');
      }
    } catch (error) {
      alert('Error approving request');
    } finally {
      setProcessing(null);
    }
  };

  const rejectRequest = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const response = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject' })
      });

      if (response.ok) {
        // Remove from pending list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        alert('Request rejected.');
      } else {
        alert('Failed to reject request');
      }
    } catch (error) {
      alert('Error rejecting request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve user payment confirmations
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No pending requests</h3>
              <p>All payment requests have been processed.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Pending Payment Requests ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead>Payment Confirmation</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.user_email}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {request.payment_confirmation}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requested_at || request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-yellow-200 text-yellow-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              disabled={processing === request.id}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approve Payment</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will grant premium access to {request.user_email}. 
                                Make sure you've verified their payment of $10.
                                <br /><br />
                                <strong>Payment Details:</strong><br />
                                {request.payment_confirmation}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => approveRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Grant Access
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              disabled={processing === request.id}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Payment</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will reject the payment request from {request.user_email}. 
                                They will remain without access.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => rejectRequest(request.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reject Request
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          <strong>How to verify payments:</strong>
          <br />• Check your PayPal account at paypal.com for recent $10 payments
          <br />• Check your Venmo account for payments with "SessionMailer" in the note
          <br />• Match the transaction ID or email with the user's confirmation details
          <br />• Once verified, click "Approve" to grant them access
        </AlertDescription>
      </Alert>
    </div>
  );
}