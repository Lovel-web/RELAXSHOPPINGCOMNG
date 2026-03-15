import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useStates, useLgas } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import type { State, Lga } from "@shared/schema";

export default function StaffSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [stateId, setStateId] = useState<number | undefined>();
  const [lgaId, setLgaId] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const { signUp, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: statesData } = useStates();
  const { data: lgasData } = useLgas(stateId);

  if (user) {
    if (user.role === "staff") navigate("/staff-dashboard");
    else if (user.role === "admin") navigate("/admin-dashboard");
    else if (user.role === "vendor") navigate("/vendor-dashboard");
    else navigate("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (!name || !phone) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    if (!stateId || !lgaId) {
      toast({ title: "Missing location", description: "Staff must select their State and LGA", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const result = await signUp(email, password, {
      name,
      phone,
      role: "staff",
      stateId,
      lgaId,
    });

    if (result.error) {
      toast({ title: "Signup failed", description: result.error, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    navigate("/pending-approval");
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-staff-signup-title">Staff Signup</h1>
          <p className="text-muted-foreground mt-1">Join the RelaxShopping delivery team</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                data-testid="input-staff-name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-staff-email"
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
                  data-testid="input-staff-password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-staff-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                data-testid="input-staff-phone"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Select
                value={stateId?.toString()}
                onValueChange={(v) => { setStateId(Number(v)); setLgaId(undefined); }}
              >
                <SelectTrigger data-testid="select-staff-state">
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
                <SelectTrigger data-testid="select-staff-lga">
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  {(lgasData as Lga[] || []).map((l: Lga) => (
                    <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
              Staff accounts require admin approval before you can access the dashboard.
            </p>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              data-testid="button-submit-staff-signup"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Please wait...</>
              ) : (
                "Create Staff Account"
              )}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium" data-testid="link-staff-login">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
