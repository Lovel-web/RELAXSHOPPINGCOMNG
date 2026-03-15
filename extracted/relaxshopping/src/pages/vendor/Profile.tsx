import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2 } from 'lucide-react';

export default function VendorProfile() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.bankAccount) {
      setBankName(userProfile.bankAccount.bankName || '');
      setAccountNumber(userProfile.bankAccount.accountNumber || '');
      setAccountName(userProfile.bankAccount.accountName || '');
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user) return;

    if (!bankName || !accountNumber || !accountName) {
      toast({
        title: 'Error',
        description: 'All bank details are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_account: {
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: 'Success',
        description: 'Bank details updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Vendor Profile
        </h1>

        <Card className="border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Account Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These details will be used for payout processing
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., GTBank, Access Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="10-digit account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                placeholder="Account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Bank Details'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
