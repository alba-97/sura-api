import { z } from 'zod';

export const transferSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  amount: z.number().min(1, 'Invalid amount'),
  cardId: z.number().int().positive(),
});

export const getMovementsSchema = z.object({
  search: z.string().optional(),
  pageNumber: z.coerce.number().int().min(1).optional().default(1),
});
