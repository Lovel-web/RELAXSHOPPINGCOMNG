import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Clock, MapPin } from 'lucide-react';
import { getCurrentBatchSlot, getBatchId, formatBatchSlot, generateSerialCode } from '@/lib/batchHelpers';
import { Estate } from '@/lib/types';
import { getGlobalSettings } from '@/lib/settingsHelpers';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, getCartTotal } = useCart();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [selectedEstate, setSelectedEstate] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState(400);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getGlobalSettings();
        setDeliveryFee(settings.DELIVERY_FEE_NGN);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    
    const loadEstates = async () => {
      const { data, error } = await supabase
        .from('estates')
        .select('*')
        .eq('lga_id', userProfile.lgaId);

      if (error) {
        console.error('Error loading estates:', error);
        return;
      }

      const estatesData = (data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        lgaId: e.lga_id,
        createdByAdminId: e.created_by_admin_id,
      })) as Estate[];
      
      setEstates(estatesData);
      
      if (userProfile.estateId) {
        setSelectedEstate(userProfile.estateId);
      }
    };
    
    loadEstates();
  }, [userProfile]);

  const subtotal = getCartTotal();
  const total = subtotal + deliveryFee;
  const { slot, date } = getCurrentBatchSlot();

  // FIGMA RULE: Batch times are FIXED (10:00 / 13:00 / 16:00)
  // This logic is already implemented in batchHelpers.ts and used here.

  const handlePayment = async () => {
    if (!userProfile) return;
    
    if (!selectedEstate) {
      toast({
        title: 'Estate Required',
        description: 'Please select your estate or hotel',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const batchId = getBatchId(date, slot, userProfile.lgaId);
      
      // Get estate name for serial code
      const selectedEstateData = estates.find(e => e.id === selectedEstate);
      const estateName = selectedEstateData?.name || 'EST';
      
      // Generate order count for serial code
      const orderIndex = Math.floor(Date.now() / 1000) % 1000;
      const serialCode = generateSerialCode(estateName, orderIndex);
      
      // Create order document
      const orderData = {
        user_id: userProfile.uid,
        items: cart.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          qty: item.quantity,
          price: item.product.price,
        })),
        subtotal,
        delivery_fee: deliveryFee,
        vat: 0,
        total,
        estate_id: selectedEstate,
        lga_id: userProfile.lgaId,
        batch_id: batchId,
        batch_slot: slot,
        batch_date: date,
        serial_code: serialCode,
        payment_ref: '',
        payment_status: 'pending',
        status: 'pending',
      };

      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Initialize Paystack payment
      const response = await fetch('/.netlify/functions/paystack-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userProfile.email,
          amount: total,
          orderId: orderResult.id,
          metadata: {
            userId: userProfile.uid,
            lgaId: userProfile.lgaId,
            estateId: selectedEstate,
            batchId,
            serialCode,
          },
        }),
      });

      const data = await response.json();

      if (data.status && data.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initialize payment',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  if (!userProfile || loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-3xl font-medium text-center mb-2">Checkout</h1>
        <p className="text-center text-muted-foreground mb-8">Review your order before payment</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Delivery Details */}
          <Card className="card-calm">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{userProfile.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{userProfile.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Estate/Hotel</p>
                <Select value={selectedEstate} onValueChange={setSelectedEstate}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select your location" />
                  </SelectTrigger>
                  <SelectContent>
                    {estates.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No estates available
                      </SelectItem>
                    ) : (
                      estates.map((estate) => (
                        <SelectItem key={estate.id} value={estate.id}>
                          {estate.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Batch Info */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Delivery Batch:</span>
                  <span className="font-medium">{formatBatchSlot(slot)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  {date === new Date().toISOString().split('T')[0] ? 'Today' : date}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="card-calm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      ₦{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-medium pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">₦{total.toLocaleString()}</span>
                </div>
              </div>
              
              <Button
                onClick={handlePayment}
                disabled={loading || !selectedEstate}
                className="w-full bg-primary hover:bg-primary/90 mt-4"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₦${total.toLocaleString()}`
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Paystack
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
