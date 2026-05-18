import { EMAIL_IS_REQUIRED, INVALID_AMOUNT } from '@/config/errors';
import { z } from 'zod';

export const transferSchema = z.object({
  email: z.string().min(1, EMAIL_IS_REQUIRED),
  amount: z.number().min(1, INVALID_AMOUNT),
  cardId: z.number().int().positive(),
});

export const getMovementsSchema = z.object({
  search: z.string().optional(),
  pageNumber: z.coerce.number().int().min(1).optional().default(1),
});
