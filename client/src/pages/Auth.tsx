import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useStates, useLgas } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import type { State, Lga } from "@shared/schema";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("customer");
  const [stateId, setStateId] = useState<number | undefined>();
  const [lgaId, setLgaId] = useState<number | undefined>();
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: statesData } = useStates();
  const { data: lgasData } = useLgas(stateId);

  if (user) {
    redirectByRole(user.role, navigate);
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "login") {
      const result = await signIn(email, password);
      if (result.error) {
        toast({ title: "Login failed", description: result.error, variant: "destructive" });
        setSubmitting(false);
        return;
      }
    } else {
      if (!name || !phone) {
        toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const profile: any = { name, phone, role };
      if (role === "vendor" || role === "staff") {
        if (!stateId || !lgaId) {
          toast({ title: "Missing location", description: "Vendors and staff must select their State and LGA", variant: "destructive" });
          setSubmitting(false);
          return;
        }
        profile.stateId = stateId;
        profile.lgaId = lgaId;
      }
      if (role === "vendor") {
        profile.bankName = bankName || undefined;
        profile.accountNumber = accountNumber || undefined;
      }

      const result = await signUp(email, password, profile);
      if (result.error) {
        toast({ title: "Signup failed", description: result.error, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      if (role === "vendor" || role === "staff") {
        navigate("/pending-approval");
        setSubmitting(false);
        return;
      }
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
          <p className="text-muted-foreground mt-1">Your local marketplace</p>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
          <div className="flex mb-6 bg-secondary/50 rounded-lg p-1">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "login" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}
              onClick={() => setMode("login")}
              data-testid="button-tab-login"
            >
              Log In
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "signup" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}
              onClick={() => setMode("signup")}
              data-testid="button-tab-signup"
            >
              Sign Up
            </button>
          </div>

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
                  placeholder="Min 6 characters"
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

            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    data-testid="input-name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    placeholder="08012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(role === "vendor" || role === "staff") && (
                  <>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={stateId?.toString()}
                        onValueChange={(v) => { setStateId(Number(v)); setLgaId(undefined); }}
                      >
                        <SelectTrigger data-testid="select-state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {(statesData as State[] || []).map((s: State) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>LGA</Label>
                      <Select
                        value={lgaId?.toString()}
                        onValueChange={(v) => setLgaId(Number(v))}
                        disabled={!stateId}
                      >
                        <SelectTrigger data-testid="select-lga">
                          <SelectValue placeholder="Select LGA" />
                        </SelectTrigger>
                        <SelectContent>
                          {(lgasData as Lga[] || []).map((l: Lga) => (
                            <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {role === "vendor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name (optional)</Label>
                      <Input
                        id="bankName"
                        data-testid="input-bank-name"
                        placeholder="e.g. GTBank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number (optional)</Label>
                      <Input
                        id="accountNumber"
                        data-testid="input-account-number"
                        placeholder="0123456789"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {(role === "vendor" || role === "staff") && (
                  <p className="text-xs text-muted-foreground bg-yellow-50 rounded-lg p-3">
                    Vendor and staff accounts require admin approval before you can access the dashboard.
                  </p>
                )}
              </>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={submitting}
              data-testid="button-submit-auth"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Please wait...</>
              ) : mode === "login" ? (
                "Log In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
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
      navigate("/");
      break;
  }
}
