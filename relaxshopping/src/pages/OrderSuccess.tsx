import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-primary/20 shadow-2xl shadow-primary/20">
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/10 p-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">Order Successful!</h1>
            <p className="text-muted-foreground">
              Your order has been placed and payment confirmed.
            </p>
          </div>

          {reference && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Payment Reference</p>
              <p className="font-mono text-sm">{reference}</p>
            </div>
          )}

          <div className="space-y-2 pt-4">
            <Button
              onClick={() => navigate('/customer/orders')}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              View My Orders
            </Button>
            <Button
              onClick={() => navigate('/shops')}
              variant="outline"
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
