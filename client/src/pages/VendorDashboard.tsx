import { Navigation } from "@/components/Navigation";
import { useProducts, useCreateProduct } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { Package, Upload, FileSpreadsheet, Plus, Loader2, ImagePlus } from "lucide-react";
import { type Product } from "@shared/schema";

const CATEGORIES = ["Grains", "Legumes", "Dairy", "Beverages", "Snacks", "Vegetables", "Fruits", "Meat", "Oil", "Seasoning", "Other"];

export default function VendorDashboard() {
  const { user } = useAuth();
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"products" | "upload" | "csv">("products");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const vendorId = user?.id || 0;
  const lgaId = user?.lgaId || 0;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleManualUpload = async () => {
    if (!name || !price || !stock || !category) {
      toast({ title: "Missing fields", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setUploading(true);
    let imageUrl: string | null = null;

    if (imageFile) {
      try {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await (await import("@/lib/supabase")).supabase.auth.getSession()).data.session?.access_token || ""}`,
          },
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.url;
        }
      } catch {
        toast({ title: "Image upload failed", description: "Product will be created without image", variant: "destructive" });
      }
    }

    createProduct.mutate(
      {
        vendorId,
        name,
        price: parseInt(price),
        vendorCost: Math.round(parseInt(price) * 0.9),
        stock: parseInt(stock),
        lgaId,
        category,
        imageUrl,
      },
      {
        onSuccess: () => {
          toast({ title: "Product added!", description: `${name} has been listed.` });
          setName(""); setPrice(""); setStock(""); setCategory("");
          setImageFile(null); setImagePreview(null);
          setUploading(false);
        },
        onError: () => {
          toast({ title: "Failed", description: "Could not add product", variant: "destructive" });
          setUploading(false);
        },
      }
    );
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });

        if (row.product_name && row.price && row.stock) {
          createProduct.mutate({
            vendorId,
            name: row.product_name,
            price: parseInt(row.price),
            vendorCost: Math.round(parseInt(row.price) * 0.9),
            stock: parseInt(row.stock),
            lgaId,
            category: row.category || "Other",
            imageUrl: null,
          });
          added++;
        }
      }

      toast({ title: "CSV Imported", description: `${added} products queued for upload` });
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" data-testid="text-vendor-title">Vendor Dashboard</h1>

        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === "products" ? "default" : "outline"}
            onClick={() => setTab("products")}
            data-testid="button-tab-products"
          >
            <Package className="w-4 h-4 mr-2" /> My Products
          </Button>
          <Button
            variant={tab === "upload" ? "default" : "outline"}
            onClick={() => setTab("upload")}
            data-testid="button-tab-upload"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
          <Button
            variant={tab === "csv" ? "default" : "outline"}
            onClick={() => setTab("csv")}
            data-testid="button-tab-csv"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV Upload
          </Button>
        </div>

        {tab === "products" && (
          <div className="space-y-3" data-testid="list-vendor-products">
            {isLoading ? (
              <p className="text-muted-foreground">Loading products...</p>
            ) : (products as Product[] || []).length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No products yet. Upload your first product!</p>
              </div>
            ) : (
              (products as Product[]).map((p) => (
                <div key={p.id} className="flex items-center gap-4 bg-white rounded-xl border border-border/50 p-4" data-testid={`card-product-${p.id}`}>
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 opacity-20" /></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.category} &middot; {p.stock} in stock</p>
                  </div>
                  <span className="text-primary font-bold">₦{p.price.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "upload" && (
          <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4 max-w-md">
            <h2 className="font-semibold text-lg">Add New Product</h2>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                data-testid="input-product-image"
              />
              <div
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => imageInputRef.current?.click()}
                data-testid="button-upload-image"
              >
                {imagePreview ? (
                  <div className="space-y-2">
                    <img src={imagePreview} alt="Preview" className="w-24 h-24 mx-auto rounded-lg object-cover" />
                    <p className="text-xs text-muted-foreground">Click to change image</p>
                  </div>
                ) : (
                  <div className="py-4 space-y-2">
                    <ImagePlus className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to add product image</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input data-testid="input-product-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rice 5kg" />
            </div>
            <div className="space-y-2">
              <Label>Price (₦)</Label>
              <Input data-testid="input-product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input data-testid="input-product-stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="20" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleManualUpload} disabled={createProduct.isPending || uploading} className="w-full" data-testid="button-add-product">
              {createProduct.isPending || uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Add Product
            </Button>
          </div>
        )}

        {tab === "csv" && (
          <div className="bg-white rounded-xl border border-border/50 p-6 max-w-md">
            <h2 className="font-semibold text-lg mb-4">Import from CSV / POS</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a CSV file with columns: <strong>product_name, price, stock, category</strong>
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              data-testid="input-csv-file"
            />

            <Button
              variant="outline"
              className="w-full h-24 border-dashed border-2 flex flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-csv"
            >
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
              <span>Click to upload CSV file</span>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
