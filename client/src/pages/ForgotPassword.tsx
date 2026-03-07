import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({ title: "Failed to send reset link", description: error.message, variant: "destructive" });
      } else {
        setSent(true);
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-forgot-title">RelaxShopping</h1>
          <p className="text-muted-foreground mt-1">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold" data-testid="text-reset-sent">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to reset your password.
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-4" data-testid="link-back-login">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-forgot-email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={submitting}
                data-testid="button-send-reset"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center mt-4">
                <Link href="/login">
                  <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-back-login-form">
                    <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to Login
                  </span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
