import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Receipt({ params }: { params: { id: string } }) {
  const { data: receipt, isLoading, error } = useQuery<{
    id: number;
    vendorName: string;
    vendorBank: string;
    vendorAccount: string;
    staffName: string;
    amount: number;
    transferReference: string;
    createdAt: string;
  }>({
    queryKey: [`/api/vendor-payments/${params.id}/receipt`],
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Receipt not found</p>
          <Link href="/staff-dashboard">
            <Button variant="outline" data-testid="button-back-dashboard">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const date = receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString("en-NG", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  }) : "N/A";

  const maskedAccount = receipt.vendorAccount.length > 4
    ? "****" + receipt.vendorAccount.slice(-4)
    : receipt.vendorAccount;

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <Navigation />
      </div>

      <main className="container max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <Link href="/staff-dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex-1" data-testid="text-receipt-title">Payment Receipt</h1>
          <Button variant="outline" onClick={handlePrint} data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-border/50 p-6 space-y-6" data-testid="receipt-card">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold text-primary">RelaxShopping</h2>
            <p className="text-sm text-muted-foreground">Vendor Settlement Receipt</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Receipt #</span>
              <span className="font-medium" data-testid="text-receipt-id">{receipt.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium" data-testid="text-receipt-date">{date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer Reference</span>
              <span className="font-medium font-mono text-xs" data-testid="text-receipt-ref">{receipt.transferReference}</span>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm">Vendor Details</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium" data-testid="text-vendor-name">{receipt.vendorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium" data-testid="text-vendor-bank">{receipt.vendorBank}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Account</span>
              <span className="font-medium" data-testid="text-vendor-account">{maskedAccount}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Amount Paid</span>
              <span className="text-primary" data-testid="text-receipt-amount">₦{receipt.amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Processed by: {receipt.staffName}</p>
          </div>

          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            <p>This is an automated receipt from RelaxShopping.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
