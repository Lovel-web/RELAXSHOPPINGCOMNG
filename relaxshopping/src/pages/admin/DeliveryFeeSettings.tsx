import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getGlobalSettings, updateDeliveryFee } from '@/lib/settingsHelpers';
import { createAdminLog } from '@/lib/adminLogHelpers';
import { notifyAdminAction } from '@/lib/notificationHelpers';
import { toast } from 'sonner';
import { DollarSign, Save } from 'lucide-react';

export const DeliveryFeeSettings = () => {
  const { userProfile } = useAuth();
  const [currentFee, setCurrentFee] = useState<number>(400);
  const [newFee, setNewFee] = useState<string>('400');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentFee();
  }, []);

  const fetchCurrentFee = async () => {
    try {
      const settings = await getGlobalSettings();
      setCurrentFee(settings.DELIVERY_FEE_NGN);
      setNewFee(settings.DELIVERY_FEE_NGN.toString());
    } catch (error) {
      console.error('Error fetching delivery fee:', error);
      toast.error('Failed to load delivery fee');
    }
  };

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const feeValue = parseInt(newFee);
    if (isNaN(feeValue) || feeValue < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (feeValue === currentFee) {
      toast.info('Fee is already set to this amount');
      return;
    }

    if (!confirm(`Are you sure you want to change the delivery fee from ₦${currentFee} to ₦${feeValue}?`)) {
      return;
    }

    setLoading(true);
    try {
      await updateDeliveryFee(feeValue);

      await createAdminLog(
        userProfile.uid,
        userProfile.fullName,
        'DELIVERY_FEE_UPDATED',
        `Changed delivery fee from ₦${currentFee} to ₦${feeValue}`
      );

      await notifyAdminAction(
        'DELIVERY_FEE_UPDATED',
        `Delivery fee changed from ₦${currentFee} to ₦${feeValue} by ${userProfile.fullName}`
      );

      toast.success(`Delivery fee updated to ₦${feeValue}`);
      setCurrentFee(feeValue);
    } catch (error) {
      console.error('Error updating delivery fee:', error);
      toast.error('Failed to update delivery fee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Delivery Fee Settings
        </CardTitle>
        <CardDescription>
          Set the standard delivery fee for all orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateFee} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentFee">Current Delivery Fee</Label>
            <div className="text-2xl font-bold text-primary">
              ₦{currentFee.toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newFee">New Delivery Fee (₦)</Label>
            <Input
              id="newFee"
              type="number"
              min="0"
              step="1"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              placeholder="Enter new delivery fee"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !newFee || parseInt(newFee) === currentFee}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Updating...' : 'Update Delivery Fee'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
