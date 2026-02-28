import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [orderCode, setOrderCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");

    if (!reference) {
      setStatus("failed");
      setErrorMsg("No payment reference found");
      return;
    }

    apiRequest("POST", "/api/payments/verify", { reference })
      .then(async (res) => {
        const data = await res.json();
        if (data.success) {
          setStatus("success");
          setOrderCode(data.orderCode || "");
          setTimeout(() => {
            navigate(`/success?code=${data.orderCode}`);
          }, 2000);
        } else {
          setStatus("failed");
          setErrorMsg("Payment verification failed");
        }
      })
      .catch((err) => {
        setStatus("failed");
        setErrorMsg(err.message || "Payment verification failed");
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-lg mx-auto px-4 py-16 text-center">
        {status === "verifying" && (
          <div className="animate-enter" data-testid="status-verifying">
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </div>
        )}

        {status === "success" && (
          <div className="animate-enter" data-testid="status-success">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Confirmed!</h1>
            <p className="text-muted-foreground mb-4">Redirecting to your order...</p>
            {orderCode && (
              <p className="text-lg font-semibold text-primary" data-testid="text-order-code">{orderCode}</p>
            )}
          </div>
        )}

        {status === "failed" && (
          <div className="animate-enter" data-testid="status-failed">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
            <p className="text-muted-foreground mb-6">{errorMsg}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/cart">
                <Button variant="outline" data-testid="button-back-cart">Back to Cart</Button>
              </Link>
              <Link href="/">
                <Button data-testid="button-continue-shopping">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
