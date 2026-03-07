import { Navigation } from "@/components/Navigation";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useStates, useLgas } from "@/hooks/use-locations";
import { apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Package, Upload, FileSpreadsheet, Plus, Loader2, ImagePlus, Pencil, Trash2, MapPin, Wallet, CreditCard, Receipt } from "lucide-react";
import { type Product, type State, type Lga, type VendorPayment } from "@shared/schema";

const CATEGORIES = ["Grains", "Legumes", "Dairy", "Beverages", "Snacks", "Vegetables", "Fruits", "Meat", "Oil", "Seasoning", "Other"];

const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank" },
  { code: "063", name: "Diamond Bank" },
  { code: "050", name: "Ecobank" },
  { code: "084", name: "Enterprise Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "GTBank" },
  { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "526", name: "Parallex Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "221", name: "Stanbic IBTC" },
  { code: "068", name: "Standard Chartered" },
  { code: "232", name: "Sterling Bank" },
  { code: "100", name: "Suntrust Bank" },
  { code: "032", name: "Union Bank" },
  { code: "033", name: "United Bank for Africa" },
  { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "999992", name: "OPay" },
  { code: "999991", name: "PalmPay" },
  { code: "50211", name: "Kuda Bank" },
  { code: "090267", name: "Kuda Microfinance Bank" },
  { code: "999998", name: "Carbon" },
];

export default function VendorDashboard() {
  const { user, refreshProfile } = useAuth();
  const vendorId = user?.id || 0;
  const lgaId = user?.lgaId || 0;
  const { data: allProducts, isLoading } = useProducts();
  const myProducts = (allProducts as Product[] || []).filter(p => p.vendorId === vendorId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"products" | "upload" | "csv" | "payments" | "profile">("products");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const [editingBank, setEditingBank] = useState(false);
  const [bankCode, setBankCode] = useState(user?.bankName || "");
  const [bankAccNum, setBankAccNum] = useState(user?.accountNumber || "");
  const [bankSaving, setBankSaving] = useState(false);

  const { data: statesData } = useStates();
  const { data: lgasData } = useLgas(user?.stateId || undefined);

  const stateName = user?.stateId && statesData
    ? (statesData as State[]).find((s) => s.id === user.stateId)?.name || "—"
    : "—";
  const lgaName = user?.lgaId && lgasData
    ? (lgasData as Lga[]).find((l) => l.id === user.lgaId)?.name || "—"
    : "—";

  const bankDisplayName = user?.bankName
    ? NIGERIAN_BANKS.find((b) => b.code === user.bankName)?.name || user.bankName
    : "—";

  const { data: payments, isLoading: paymentsLoading } = useQuery<VendorPayment[]>({
    queryKey: ["/api/vendor/payments"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/vendor/payments", { credentials: "include", headers });
      if (!res.ok) throw new Error("Failed to fetch payments");
      return await res.json();
    },
    enabled: tab === "payments",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const headers = await getAuthHeaders();
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      });
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        return data.url;
      }
    } catch {
      toast({ title: "Image upload failed", variant: "destructive" });
    }
    return null;
  }

  const resolvedCategory = category === "Other" ? customCategory : category;
  const resolvedEditCategory = editCategory === "Other" ? editCustomCategory : editCategory;

  const handleManualUpload = async () => {
    const finalCategory = resolvedCategory;
    if (!name || !price || !stock || !finalCategory) {
      toast({ title: "Missing fields", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setUploading(true);
    let imageUrl: string | null = null;
    if (imageFile) imageUrl = await uploadImage(imageFile);

    createProduct.mutate(
      {
        vendorId,
        name,
        price: parseInt(price),
        vendorCost: Math.round(parseInt(price) * 0.9),
        stock: parseInt(stock),
        lgaId,
        category: finalCategory,
        imageUrl,
      },
      {
        onSuccess: () => {
          toast({ title: "Product added!", description: `${name} has been listed.` });
          setName(""); setPrice(""); setStock(""); setCategory(""); setCustomCategory("");
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

  function openEditModal(p: Product) {
    setEditProduct(p);
    setEditName(p.name);
    setEditPrice(p.price.toString());
    setEditStock(p.stock.toString());
    const isStandardCategory = CATEGORIES.includes(p.category || "");
    if (isStandardCategory) {
      setEditCategory(p.category || "");
      setEditCustomCategory("");
    } else {
      setEditCategory("Other");
      setEditCustomCategory(p.category || "");
    }
    setEditImageFile(null);
    setEditImagePreview(p.imageUrl || null);
  }

  async function handleEditSave() {
    if (!editProduct) return;
    const finalCategory = resolvedEditCategory;
    if (!editName || !editPrice || !editStock || !finalCategory) {
      toast({ title: "Missing fields", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setUploading(true);
    let imageUrl = editProduct.imageUrl;
    if (editImageFile) {
      const uploaded = await uploadImage(editImageFile);
      if (uploaded) imageUrl = uploaded;
    }

    updateProduct.mutate(
      {
        id: editProduct.id,
        data: {
          name: editName,
          price: parseInt(editPrice),
          vendorCost: Math.round(parseInt(editPrice) * 0.9),
          stock: parseInt(editStock),
          category: finalCategory,
          imageUrl,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Product updated!" });
          setEditProduct(null);
          setUploading(false);
        },
        onError: () => {
          toast({ title: "Failed", description: "Could not update product", variant: "destructive" });
          setUploading(false);
        },
      }
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteProduct.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Product deleted", description: `${deleteTarget.name} has been removed.` });
        setDeleteTarget(null);
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not delete product", variant: "destructive" });
      },
    });
  }

  async function handleBankSave() {
    if (!bankCode || !bankAccNum) {
      toast({ title: "Missing fields", description: "Please fill bank code and account number", variant: "destructive" });
      return;
    }
    setBankSaving(true);
    try {
      await apiRequest("PATCH", "/api/profile/bank", { bankName: bankCode, accountNumber: bankAccNum });
      toast({ title: "Bank details updated!" });
      setEditingBank(false);
      if (refreshProfile) refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Could not update bank details", variant: "destructive" });
    }
    setBankSaving(false);
  }

  function renderCategorySelect(value: string, onChange: (v: string) => void, customValue: string, onCustomChange: (v: string) => void, testPrefix?: string) {
    return (
      <>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger data-testid={`select-category${testPrefix ? `-${testPrefix}` : ""}`}>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value === "Other" && (
          <Input
            className="mt-2"
            placeholder="Enter custom category"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            data-testid={`input-custom-category${testPrefix ? `-${testPrefix}` : ""}`}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-vendor-title">Vendor Dashboard</h1>
            {(user?.stateId || user?.lgaId) && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground" data-testid="text-vendor-location">
                <MapPin className="w-3.5 h-3.5" />
                <span>{stateName}</span>
                <span>→</span>
                <span>{lgaName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={tab === "products" ? "default" : "outline"}
            onClick={() => setTab("products")}
            size="sm"
            data-testid="button-tab-products"
          >
            <Package className="w-4 h-4 mr-1" /> Products
          </Button>
          <Button
            variant={tab === "upload" ? "default" : "outline"}
            onClick={() => setTab("upload")}
            size="sm"
            data-testid="button-tab-upload"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
          <Button
            variant={tab === "csv" ? "default" : "outline"}
            onClick={() => setTab("csv")}
            size="sm"
            data-testid="button-tab-csv"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button
            variant={tab === "payments" ? "default" : "outline"}
            onClick={() => setTab("payments")}
            size="sm"
            data-testid="button-tab-payments"
          >
            <Receipt className="w-4 h-4 mr-1" /> Payments
          </Button>
          <Button
            variant={tab === "profile" ? "default" : "outline"}
            onClick={() => setTab("profile")}
            size="sm"
            data-testid="button-tab-profile"
          >
            <CreditCard className="w-4 h-4 mr-1" /> Bank
          </Button>
        </div>

        {tab === "products" && (
          <div className="space-y-3" data-testid="list-vendor-products">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : myProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No products yet. Upload your first product!</p>
              </div>
            ) : (
              myProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-4 bg-white dark:bg-card rounded-xl border border-border/50 p-4" data-testid={`card-product-${p.id}`}>
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 opacity-20" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.category} &middot; {p.stock} in stock</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-primary font-bold text-sm">₦{p.price.toLocaleString()}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditModal(p)}
                      data-testid={`button-edit-product-${p.id}`}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteTarget(p)}
                      data-testid={`button-delete-product-${p.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "upload" && (
          <div className="bg-white dark:bg-card rounded-xl border border-border/50 p-6 space-y-4 max-w-md">
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
              {renderCategorySelect(category, setCategory, customCategory, setCustomCategory)}
            </div>

            <Button onClick={handleManualUpload} disabled={createProduct.isPending || uploading} className="w-full" data-testid="button-add-product">
              {createProduct.isPending || uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Add Product
            </Button>
          </div>
        )}

        {tab === "csv" && (
          <div className="bg-white dark:bg-card rounded-xl border border-border/50 p-6 max-w-md">
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

        {tab === "payments" && (
          <div className="space-y-3" data-testid="list-vendor-payments">
            <h2 className="font-semibold text-lg mb-4">Payment History</h2>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !payments || payments.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No payments received yet.</p>
              </div>
            ) : (
              payments.map((pay) => {
                let itemsList: { productName?: string; name?: string; qty?: number; quantity?: number; unitCost?: number; vendorCost?: number }[] = [];
                try {
                  itemsList = JSON.parse(pay.itemsSnapshot || "[]");
                } catch {}
                return (
                  <div key={pay.id} className="bg-white dark:bg-card rounded-xl border border-border/50 p-4 space-y-2" data-testid={`card-payment-${pay.id}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-bold text-lg">₦{pay.amount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">
                        {pay.createdAt ? new Date(pay.createdAt).toLocaleDateString("en-NG", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        }) : "—"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ref: {pay.transferReference}
                    </div>
                    {itemsList.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs font-medium mb-1">Items settled:</p>
                        {itemsList.map((item, idx) => {
                          const itemName = item.productName || item.name || "Item";
                          const itemQty = item.qty || item.quantity || 1;
                          const itemCost = item.unitCost || item.vendorCost || 0;
                          return (
                            <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                              <span>{itemName} × {itemQty}</span>
                              <span>₦{(itemCost * itemQty).toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="bg-white dark:bg-card rounded-xl border border-border/50 p-6 max-w-md space-y-6">
            <h2 className="font-semibold text-lg">Bank & Account Details</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium" data-testid="text-profile-location">{stateName} → {lgaName}</span>
              </div>

              {!editingBank ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Bank</p>
                      <p className="font-medium" data-testid="text-bank-name">{bankDisplayName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium" data-testid="text-account-number">{user?.accountNumber || "—"}</p>
                  </div>
                  {user?.accountNameVerified && (
                    <div>
                      <p className="text-sm text-muted-foreground">Verified Name</p>
                      <p className="font-medium text-green-600" data-testid="text-verified-name">{user.accountNameVerified}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBankCode(user?.bankName || "");
                      setBankAccNum(user?.accountNumber || "");
                      setEditingBank(true);
                    }}
                    data-testid="button-edit-bank"
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Edit Bank Details
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bank</Label>
                    <Select value={bankCode} onValueChange={setBankCode}>
                      <SelectTrigger data-testid="select-bank">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_BANKS.map((b) => (
                          <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={bankAccNum}
                      onChange={(e) => setBankAccNum(e.target.value)}
                      placeholder="0123456789"
                      maxLength={10}
                      data-testid="input-account-number"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
                    Your bank details will be re-verified via Paystack when you save.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleBankSave} disabled={bankSaving} data-testid="button-save-bank">
                      {bankSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditingBank(false)} data-testid="button-cancel-bank">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Image</Label>
              <input
                ref={editImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleEditImageSelect}
                className="hidden"
                data-testid="input-edit-product-image"
              />
              <div
                className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => editImageInputRef.current?.click()}
                data-testid="button-edit-upload-image"
              >
                {editImagePreview ? (
                  <div className="space-y-1">
                    <img src={editImagePreview} alt="Preview" className="w-20 h-20 mx-auto rounded-lg object-cover" />
                    <p className="text-xs text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="py-2 space-y-1">
                    <ImagePlus className="w-6 h-6 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Click to add image</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input data-testid="input-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Price (₦)</Label>
              <Input data-testid="input-edit-price" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input data-testid="input-edit-stock" type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              {renderCategorySelect(editCategory, setEditCategory, editCustomCategory, setEditCustomCategory, "edit")}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)} data-testid="button-cancel-edit">Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateProduct.isPending || uploading} data-testid="button-save-edit">
              {updateProduct.isPending || uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} data-testid="button-cancel-delete">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteProduct.isPending} data-testid="button-confirm-delete">
              {deleteProduct.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
