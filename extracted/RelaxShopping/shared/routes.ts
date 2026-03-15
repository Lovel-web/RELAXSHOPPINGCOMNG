import { z } from 'zod';
import { insertProductSchema, insertUserSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({ lgaId: z.string().optional() }).optional(),
      responses: { 200: z.array(z.any()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products' as const,
      input: insertProductSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation },
    }
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,
      input: z.object({ staffId: z.string().optional() }).optional(),
      responses: { 200: z.array(z.any()) },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status' as const,
      input: z.object({ status: z.string() }),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    }
  },
  locations: {
    states: {
      method: 'GET' as const,
      path: '/api/states' as const,
      responses: { 200: z.array(z.any()) }
    },
    lgas: {
      method: 'GET' as const,
      path: '/api/states/:stateId/lgas' as const,
      responses: { 200: z.array(z.any()) }
    },
    estates: {
      method: 'GET' as const,
      path: '/api/lgas/:lgaId/estates' as const,
      responses: { 200: z.array(z.any()) }
    }
  },
  auth: {
    signup: {
      method: 'POST' as const,
      path: '/api/auth/signup' as const,
      input: insertUserSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
