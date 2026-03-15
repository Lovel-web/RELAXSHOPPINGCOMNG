import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const Shops = () => {
  const { userProfile } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase.from('products').select('*');
        
        if (userProfile && userProfile.lgaId) {
          query = query.eq('lga_id', userProfile.lgaId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching products:', error);
          toast.error('Failed to load products');
          return;
        }

        const productsData = (data || [])
          .map((doc: any) => ({
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
          } as Product))
          .filter((product) => {
            if (!product.name || product.price === undefined || !product.unit) {
              console.warn('Invalid product data:', product);
              return false;
            }
            return true;
          });

        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userProfile]);

  const handleAddToCart = (product: Product) => {
    if (!userProfile) {
      toast.error('Please login to add items to cart');
      return;
    }
    addToCart(product, 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 text-gradient">Browse Products</h1>
          <p className="text-muted-foreground">
            {userProfile ? `Showing products available in your area` : 'Sign in to see products in your area'}
          </p>
        </motion.div>

        {products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No products available in your area yet.</p>
              {!userProfile && (
                <Button asChild>
                  <Link to="/auth/login">Login to see products</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="gradient-card hover-lift h-full flex flex-col">
                  {product.imageBase64 && (
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.imageBase64.startsWith('data:') ? product.imageBase64 : `data:image/png;base64,${product.imageBase64}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-primary">
                        ₦{(product.price || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Per {product.unit || 'unit'}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full gradient-primary"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || !userProfile}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shops;
