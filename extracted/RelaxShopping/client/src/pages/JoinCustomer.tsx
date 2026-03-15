import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useStates, useLgas } from "@/hooks/use-locations";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, ShoppingBag, MessageCircle, ChevronRight } from "lucide-react";
import type { State, Lga } from "@shared/schema";

export default function JoinCustomer() {
  const [, navigate] = useLocation();
  const [stateId, setStateId] = useState<number | undefined>();
  const [lgaId, setLgaId] = useState<number | undefined>();

  const { data: statesData } = useStates();
  const { data: lgasData } = useLgas(stateId);

  const { data: lgaDetail } = useQuery({
    queryKey: ['/api/lgas', lgaId],
    enabled: !!lgaId,
    queryFn: async () => {
      const res = await fetch(`/api/lgas/${lgaId}`);
      if (!res.ok) throw new Error("Failed to fetch LGA details");
      return res.json();
    },
  });

  const step = !stateId ? 1 : !lgaId ? 2 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-landing">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold" data-testid="text-join-title">Find Your Estate</h1>
          <p className="text-muted-foreground mt-1">Select your location to start shopping</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
            <div className="space-y-2">
              <Label>Step 1: Select State</Label>
              <Select
                value={stateId?.toString()}
                onValueChange={(v) => { setStateId(Number(v)); setLgaId(undefined); }}
              >
                <SelectTrigger data-testid="select-state">
                  <SelectValue placeholder="Choose your state" />
                </SelectTrigger>
                <SelectContent>
                  {(statesData as State[] || []).map((s: State) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {stateId && (
              <div className="space-y-2">
                <Label>Step 2: Select LGA</Label>
                <Select
                  value={lgaId?.toString()}
                  onValueChange={(v) => setLgaId(Number(v))}
                >
                  <SelectTrigger data-testid="select-lga">
                    <SelectValue placeholder="Choose your LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {(lgasData as Lga[] || []).map((l: Lga) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {lgaId && lgaDetail && (
            <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-3">
              {lgaDetail.estates && lgaDetail.estates.length > 0 && (
                <div className="bg-white rounded-xl border border-border/50 p-6">
                  <h3 className="font-semibold mb-3">Estates in {lgaDetail.name}</h3>
                  <div className="space-y-2">
                    {lgaDetail.estates.map((e: any) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`text-estate-${e.id}`}>
                        <MapPin className="w-3 h-3 text-primary" />
                        {e.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-14 text-base font-semibold"
                onClick={() => navigate(`/shop?lga=${lgaId}`)}
                data-testid="button-browse-products"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Browse Products
                <ChevronRight className="w-5 h-5 ml-auto" />
              </Button>

              {lgaDetail.whatsappLink && (
                <a href={lgaDetail.whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full h-14 text-base font-semibold border-primary/30 text-primary" data-testid="button-whatsapp">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Join WhatsApp Group
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
