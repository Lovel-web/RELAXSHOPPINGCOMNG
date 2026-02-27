import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertOrder, type InsertUser } from "@shared/schema";

export function useOrders(staffId?: string) {
  return useQuery({
    queryKey: [api.orders.list.path, staffId],
    queryFn: async () => {
      const url = staffId 
        ? `${api.orders.list.path}?staffId=${staffId}`
        : api.orders.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return await res.json();
    },
  });
}

export interface CreateOrderData {
  customer: InsertUser;
  estateId: number;
  items: Array<{ productId: number; quantity: number; price?: number }>;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create order");
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
      const res = await fetch(url, {
        method: api.orders.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update order status");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.orders.list.path] }),
  });
}
