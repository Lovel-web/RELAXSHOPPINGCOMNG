import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Package } from "lucide-react";
import { motion } from "framer-motion";

export default function Success() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container max-w-lg mx-auto px-4 py-20 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-border/50"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <CheckCircle className="w-12 h-12" />
          </div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Order Successful!
          </h1>
          
          <p className="text-muted-foreground mb-8">
            Your order has been confirmed and assigned to a delivery staff. 
            You will receive a WhatsApp notification shortly.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              Tracking Code
            </p>
            <p className="text-xl font-mono font-bold text-gray-900">
              HAW-4F8K2
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full h-12 rounded-xl text-lg font-semibold">
                Continue Shopping
              </Button>
            </Link>
            
            <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-12 rounded-xl border-2">
                Chat Support
              </Button>
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
