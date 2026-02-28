import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";

export function useProducts(lgaId?: string) {
  return useQuery({
    queryKey: [api.products.list.path, lgaId].filter(Boolean),
    queryFn: async () => {
      const url = lgaId 
        ? `${api.products.list.path}?lgaId=${lgaId}`
        : api.products.list.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return await res.json();
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.products.create.path, data);
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}
