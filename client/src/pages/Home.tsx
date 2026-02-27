import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { useStates, useLgas } from "@/hooks/use-locations";
import { ProductCard } from "@/components/ProductCard";
import { Navigation } from "@/components/Navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [selectedState, setSelectedState] = useState<number>();
  const [selectedLga, setSelectedLga] = useState<number>();
  const [search, setSearch] = useState("");

  const { data: states } = useStates();
  const { data: lgas } = useLgas(selectedState);
  const { data: products, isLoading } = useProducts(selectedLga?.toString());

  const filteredProducts = products?.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navigation />
      
      {/* Hero / Location Picker */}
      <section className="bg-primary text-white py-8 px-4 rounded-b-[2.5rem] shadow-lg mb-8">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="opacity-90 mb-6">Shop from verified vendors in your LGA</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> State
              </label>
              <Select onValueChange={(v) => {
                setSelectedState(Number(v));
                setSelectedLga(undefined);
              }}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> LGA
              </label>
              <Select 
                disabled={!selectedState} 
                onValueChange={(v) => setSelectedLga(Number(v))}
                value={selectedLga?.toString()}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-white/30">
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  {lgas?.map((l: any) => (
                    <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <main className="container max-w-7xl mx-auto px-4">
        {/* Search */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-10 h-12 rounded-full border-none shadow-sm focus-visible:ring-primary"
            placeholder="Search products or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Product Grid */}
        {!selectedLga ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="w-12 h-12 text-primary/20 mb-4" />
              <h3 className="text-lg font-semibold">Pick your location</h3>
              <p className="text-muted-foreground">Select your State and LGA to see products near you.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts?.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
