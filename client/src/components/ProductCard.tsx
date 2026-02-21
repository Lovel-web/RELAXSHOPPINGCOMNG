import { type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();

  const handleAdd = () => {
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
      duration: 1500,
      className: "bg-primary text-white border-none",
    });
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="aspect-[4/3] w-full overflow-hidden bg-secondary/30 relative">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-50">
             <ShoppingBag className="w-12 h-12 opacity-20" />
          </div>
        )}
        
        {/* Quick add button that appears on hover/mobile */}
        <button
          onClick={handleAdd}
          className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors active:scale-95 md:translate-y-12 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-display font-semibold text-lg line-clamp-1 text-foreground/90">
            {product.name}
          </h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">By Vendor #{product.vendorId}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            ₦{product.price.toLocaleString()}
          </span>
          <span className="text-xs px-2 py-1 bg-secondary rounded-full text-secondary-foreground font-medium">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </span>
        </div>
      </div>
    </div>
  );
}
