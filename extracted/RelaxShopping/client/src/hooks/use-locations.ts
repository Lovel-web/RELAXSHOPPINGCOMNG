import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useStates() {
  return useQuery({
    queryKey: [api.locations.states.path],
    queryFn: async () => {
      const res = await fetch(api.locations.states.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch states");
      return await res.json();
    },
  });
}

export function useLgas(stateId?: number) {
  return useQuery({
    queryKey: [api.locations.lgas.path, stateId],
    enabled: !!stateId,
    queryFn: async () => {
      if (!stateId) return [];
      const url = buildUrl(api.locations.lgas.path, { stateId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch LGAs");
      return await res.json();
    },
  });
}

export function useEstates(lgaId?: number) {
  return useQuery({
    queryKey: [api.locations.estates.path, lgaId],
    enabled: !!lgaId,
    queryFn: async () => {
      if (!lgaId) return [];
      const url = buildUrl(api.locations.estates.path, { lgaId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch estates");
      return await res.json();
    },
  });
}
