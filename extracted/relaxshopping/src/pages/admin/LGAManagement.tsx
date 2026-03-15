import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { LGA, Estate } from '@/lib/types';
import { toast } from 'sonner';
import { Trash2, Plus, MapPin } from 'lucide-react';
import { createAdminLog } from '@/lib/adminLogHelpers';
import { notifyAdminAction } from '@/lib/notificationHelpers';

export const LGAManagement = () => {
  const { userProfile, user } = useAuth();
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [newLGAName, setNewLGAName] = useState('');
  const [newEstateName, setNewEstateName] = useState('');
  const [selectedLGA, setSelectedLGA] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.state) {
      fetchLGAs();
    }
  }, [userProfile]);

  useEffect(() => {
    if (selectedLGA) {
      fetchEstates(selectedLGA);
    }
  }, [selectedLGA]);

  const fetchLGAs = async () => {
    if (!userProfile?.state) return;

    try {
      const { data, error } = await supabase
        .from('lgas')
        .select('*')
        .eq('state', userProfile.state);
      
      if (error) throw error;
      
      const lgasData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        state: item.state,
        createdByAdminId: item.created_by_admin_id,
      })) as LGA[];
      
      setLgas(lgasData);
      if (lgasData.length > 0 && !selectedLGA) {
        setSelectedLGA(lgasData[0].id);
      }
    } catch (error) {
      console.error('Error fetching LGAs:', error);
      toast.error('Failed to load LGAs');
    }
  };

  const fetchEstates = async (lgaId: string) => {
    try {
      const { data, error } = await supabase
        .from('estates')
        .select('*')
        .eq('lga_id', lgaId);
      
      if (error) throw error;
      
      const estatesData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        lgaId: item.lga_id,
        createdByAdminId: item.created_by_admin_id,
      })) as Estate[];
      
      setEstates(estatesData);
    } catch (error) {
      console.error('Error fetching estates:', error);
      toast.error('Failed to load estates');
    }
  };

  const handleAddLGA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLGAName.trim() || !userProfile || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('lgas').insert({
        name: newLGAName.trim(),
        state: userProfile.state,
        created_by_admin_id: user.id,
      });
      
      if (error) throw error;

      await createAdminLog(
        user.id,
        userProfile.fullName,
        'LGA_CREATED',
        `Created LGA: ${newLGAName} in ${userProfile.state}`
      );

      await notifyAdminAction('LGA_CREATED', `New LGA: ${newLGAName} in ${userProfile.state}`);

      toast.success(`LGA "${newLGAName}" created successfully`);
      setNewLGAName('');
      fetchLGAs();
    } catch (error) {
      console.error('Error creating LGA:', error);
      toast.error('Failed to create LGA');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEstate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstateName.trim() || !selectedLGA || !userProfile || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('estates').insert({
        name: newEstateName.trim(),
        lga_id: selectedLGA,
        created_by_admin_id: user.id,
      });
      
      if (error) throw error;

      const lgaName = lgas.find(l => l.id === selectedLGA)?.name || 'Unknown';
      await createAdminLog(
        user.id,
        userProfile.fullName,
        'ESTATE_CREATED',
        `Created Estate: ${newEstateName} in LGA: ${lgaName}`
      );

      await notifyAdminAction('ESTATE_CREATED', `New Estate: ${newEstateName} in ${lgaName}`);

      toast.success(`Estate "${newEstateName}" created successfully`);
      setNewEstateName('');
      fetchEstates(selectedLGA);
    } catch (error) {
      console.error('Error creating estate:', error);
      toast.error('Failed to create estate');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLGA = async (lgaId: string, lgaName: string) => {
    if (!confirm(`Are you sure you want to delete LGA "${lgaName}"? This will also delete all estates in this LGA.`)) {
      return;
    }

    try {
      // Delete all estates in this LGA first
      await supabase.from('estates').delete().eq('lga_id', lgaId);
      
      // Delete LGA
      const { error } = await supabase.from('lgas').delete().eq('id', lgaId);
      if (error) throw error;

      await createAdminLog(
        user!.id,
        userProfile!.fullName,
        'LGA_DELETED',
        `Deleted LGA: ${lgaName}`
      );

      toast.success(`LGA "${lgaName}" deleted successfully`);
      fetchLGAs();
    } catch (error) {
      console.error('Error deleting LGA:', error);
      toast.error('Failed to delete LGA');
    }
  };

  const handleDeleteEstate = async (estateId: string, estateName: string) => {
    if (!confirm(`Are you sure you want to delete estate "${estateName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('estates').delete().eq('id', estateId);
      if (error) throw error;

      await createAdminLog(
        user!.id,
        userProfile!.fullName,
        'ESTATE_DELETED',
        `Deleted Estate: ${estateName}`
      );

      toast.success(`Estate "${estateName}" deleted successfully`);
      fetchEstates(selectedLGA);
    } catch (error) {
      console.error('Error deleting estate:', error);
      toast.error('Failed to delete estate');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LGA Management */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            LGA Management
          </CardTitle>
          <CardDescription>
            Manage Local Government Areas in {userProfile?.state}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddLGA} className="flex gap-2">
            <Input
              placeholder="Enter LGA name"
              value={newLGAName}
              onChange={(e) => setNewLGAName(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !newLGAName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </form>

          <div className="space-y-2">
            {lgas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No LGAs created yet</p>
            ) : (
              lgas.map((lga) => (
                <div
                  key={lga.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedLGA === lga.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedLGA(lga.id)}
                >
                  <span className="font-medium">{lga.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLGA(lga.id, lga.name);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estate Management */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Estate Management
          </CardTitle>
          <CardDescription>
            {selectedLGA ? `Manage estates in ${lgas.find(l => l.id === selectedLGA)?.name}` : 'Select an LGA first'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedLGA ? (
            <>
              <form onSubmit={handleAddEstate} className="flex gap-2">
                <Input
                  placeholder="Enter estate/hotel name"
                  value={newEstateName}
                  onChange={(e) => setNewEstateName(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !newEstateName.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </form>

              <div className="space-y-2">
                {estates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No estates created yet</p>
                ) : (
                  estates.map((estate) => (
                    <div
                      key={estate.id}
                      className="flex items-center justify-between p-3 rounded-lg border-2"
                    >
                      <span className="font-medium">{estate.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEstate(estate.id, estate.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Please select or create an LGA first
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
