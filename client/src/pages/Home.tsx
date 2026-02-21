import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useProducts } from "@/hooks/use-products";
import { useStates, useLgas, useEstates } from "@/hooks/use-locations";
import { ProductCard } from "@/components/ProductCard";
import { Navigation } from "@/components/Navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Search, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedLga, setSelectedLga] = useState<string>("");
  const [_, setLocation] = useLocation();

  const { data: states } = useStates();
  const { data: lgas } = useLgas(selectedState ? parseInt(selectedState) : undefined);
  const { data: products, isLoading } = useProducts(selectedLga);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Navigation />
      
      {/* Hero / Filter Section */}
      <div className="bg-white border-b sticky top-0 md:top-16 z-40 shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 text-primary font-medium whitespace-nowrap">
              <MapPin className="w-5 h-5" />
              <span>I want to shop in:</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 w-full md:w-auto flex-1">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states?.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedLga} 
                onValueChange={setSelectedLga}
                disabled={!selectedState}
              >
                <SelectTrigger className="w-full bg-gray-50 border-gray-200">
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
        </div>
      </div>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {!selectedLga ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Welcome to RelaxShopping
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Select your location above to see products available in your estate.
              We deliver straight to your doorstep.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">
                  Featured Products
                </h2>
                <p className="text-muted-foreground">Fresh from vendors in your area</p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm" />
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
                <p className="text-muted-foreground">Check back later for new items.</p>
              </div>
            ) : (
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {products?.map((product: any) => (
                  <motion.div key={product.id} variants={item}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
