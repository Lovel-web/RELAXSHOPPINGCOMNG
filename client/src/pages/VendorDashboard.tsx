import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useCreateProduct } from "@/hooks/use-products";
import { useStates, useLgas } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Package, Upload } from "lucide-react";

export default function VendorDashboard() {
  const { toast } = useToast();
  const createProduct = useCreateProduct();
  const { data: states } = useStates();
  const [selectedState, setSelectedState] = useState("");
  const { data: lgas } = useLgas(selectedState ? parseInt(selectedState) : undefined);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    imageUrl: "",
    lgaId: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        name: formData.name,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        imageUrl: formData.imageUrl,
        lgaId: parseInt(formData.lgaId),
        vendorId: 1 // Mock Vendor ID
      });
      
      toast({ title: "Product Created", description: "Your product is now live." });
      setFormData({ name: "", price: "", stock: "", imageUrl: "", lgaId: "" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create product" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Vendor Portal</h1>
            <p className="text-muted-foreground">Manage your inventory</p>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar Stats */}
          <div className="md:col-span-1 space-y-4">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
               <h3 className="text-muted-foreground text-sm font-medium mb-1">Total Sales</h3>
               <p className="text-3xl font-bold text-gray-900">₦125,000</p>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
               <h3 className="text-muted-foreground text-sm font-medium mb-1">Active Products</h3>
               <p className="text-3xl font-bold text-gray-900">14</p>
             </div>
          </div>

          {/* Main Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-border/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Plus className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold">Add New Product</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select onValueChange={setSelectedState}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {states?.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Target LGA</Label>
                    <Select 
                      disabled={!selectedState}
                      onValueChange={(val) => setFormData({...formData, lgaId: val})}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Select LGA" />
                      </SelectTrigger>
                      <SelectContent>
                        {lgas?.map((l: any) => (
                          <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input 
                    placeholder="e.g. Fresh Tomatoes (Basket)" 
                    className="bg-gray-50 border-gray-200"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₦)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="bg-gray-50 border-gray-200"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Quantity</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="bg-gray-50 border-gray-200"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Image URL (Optional)</Label>
                  <Input 
                    placeholder="https://images.unsplash.com/..." 
                    className="bg-gray-50 border-gray-200"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Paste a URL from Unsplash for best results.</p>
                </div>

                <Button type="submit" className="w-full h-12 text-lg font-semibold mt-4" disabled={createProduct.isPending}>
                  {createProduct.isPending ? "Uploading..." : "Publish Product"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
