import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";

export function useOrders() {
  return useQuery({
    queryKey: [api.orders.list.path],
  });
}

export interface CreateOrderData {
  customer: { name: string; phone: string; role: string; stateId?: number; lgaId?: number; approved?: boolean };
  estateId: number;
  items: Array<{ productId: number; quantity: number; price?: number }>;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const res = await apiRequest("POST", api.orders.create.path, data);
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.orders.list.path] }),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const url = buildUrl(api.orders.updateStatus.path, { id });
      const res = await apiRequest("PATCH", url, { status });
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.orders.list.path] }),
  });
}
