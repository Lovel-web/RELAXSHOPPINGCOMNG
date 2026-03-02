import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  if (user) {
    redirectByRole(user.role, navigate);
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const result = await signIn(email, password);
    if (result.error) {
      toast({ title: "Login failed", description: result.error, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-auth-title">RelaxShopping</h1>
          <p className="text-muted-foreground mt-1">Log in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  data-testid="input-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={submitting}
              data-testid="button-submit-auth"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Please wait...</>
              ) : (
                "Log In"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/50 space-y-2 text-center text-sm">
            <p className="text-muted-foreground">Don't have an account?</p>
            <div className="flex flex-col gap-2">
              <Link href="/join">
                <Button variant="outline" size="sm" className="w-full" data-testid="link-join-customer">
                  Join as Customer
                </Button>
              </Link>
              <div className="flex gap-2">
                <Link href="/vendor-signup" className="flex-1">
                  <Button variant="ghost" size="sm" className="w-full" data-testid="link-vendor-signup">
                    Vendor Signup
                  </Button>
                </Link>
                <Link href="/staff-signup" className="flex-1">
                  <Button variant="ghost" size="sm" className="w-full" data-testid="link-staff-signup">
                    Staff Signup
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function redirectByRole(role: string, navigate: (path: string) => void) {
  switch (role) {
    case "admin":
      navigate("/admin-dashboard");
      break;
    case "vendor":
      navigate("/vendor-dashboard");
      break;
    case "staff":
      navigate("/staff-dashboard");
      break;
    default:
      navigate("/shop");
      break;
  }
}
