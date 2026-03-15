import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CSVUploader } from '@/components/CSVUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VendorDashboard() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
    stock: '',
    imageBase64: '',
  });

  useEffect(() => {
    if (!userProfile) return;
    loadProducts();
  }, [userProfile]);

  const loadProducts = async () => {
    if (!userProfile) return;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', userProfile.uid);

    if (error) {
      console.error('Error loading products:', error);
      setLoading(false);
      return;
    }

    const productsData = (data || []).map((doc: any) => ({
      id: doc.id,
      vendorId: doc.vendor_id,
      name: doc.name,
      description: doc.description,
      price: doc.price,
      unit: doc.unit,
      stock: doc.stock,
      imageBase64: doc.image_base64,
      lgaId: doc.lga_id,
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    })) as Product[];
    
    setProducts(productsData);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { validateImageFile, resizeAndCompressImage } = await import('@/lib/imageHelpers');
    const validationError = validateImageFile(file);
    if (validationError) {
      toast({
        title: 'Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    try {
      const base64 = await resizeAndCompressImage(file);
      setFormData({ ...formData, imageBase64: base64 });
      toast({
        title: 'Success',
        description: 'Image processed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const { error } = await supabase.from('products').insert({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        stock: parseInt(formData.stock),
        image_base64: formData.imageBase64,
        vendor_id: userProfile.uid,
        lga_id: userProfile.lgaId,
      });

      if (error) throw error;

      // Notify customers and staff in same LGA
      const { notifyProductUpload } = await import('@/lib/notificationHelpers');
      await notifyProductUpload(formData.name, userProfile.fullName || 'Vendor', userProfile.lgaId || '');

      toast({
        title: 'Success',
        description: 'Product added successfully',
      });

      setFormData({
        name: '',
        description: '',
        price: '',
        unit: '',
        stock: '',
        imageBase64: '',
      });
      setDialogOpen(false);
      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCSVUpload = async (products: any[]) => {
    if (!userProfile) return;

    try {
      const productsToInsert = products.map((product) => ({
        ...product,
        vendor_id: userProfile.uid,
        lga_id: userProfile.lgaId,
      }));

      const { error } = await supabase.from('products').insert(productsToInsert);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${products.length} products uploaded successfully`,
      });
      
      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!userProfile || userProfile.role !== 'vendor') {
    return <div className="p-8 text-center">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Vendor Dashboard
          </h1>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href="/vendor/profile">Bank Details</a>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Products</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Single Product</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="single" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      placeholder="Product Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    <Textarea
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price (₦)"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="Unit (e.g., kg, piece)"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        required
                      />
                    </div>
                    <Input
                      type="number"
                      placeholder="Stock"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                    />
                    <div>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="image-upload">
                        <Button type="button" variant="outline" className="w-full" asChild>
                          <span>
                            {formData.imageBase64 ? '✓ Image Selected' : 'Upload Image'}
                          </span>
                        </Button>
                      </label>
                    </div>
                    {formData.imageBase64 && (
                      <img src={formData.imageBase64} alt="Preview" className="w-32 h-32 object-cover rounded mx-auto" />
                    )}
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary">
                      Add Product
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="bulk">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Need a template?</p>
                      <a 
                        href="/sample-products.csv"
                        download
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Download Sample CSV
                      </a>
                    </div>
                    <CSVUploader onProductsUploaded={handleCSVUpload} />
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading products...</div>
        ) : products.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No products yet. Add your first product!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="border-primary/10 shadow-lg hover:shadow-primary/20 transition-shadow">
                {product.imageBase64 && (
                  <img
                    src={product.imageBase64.startsWith('data:') ? product.imageBase64 : `data:image/png;base64,${product.imageBase64}`}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">per {product.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Stock</p>
                      <p className="font-bold">{product.stock}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
