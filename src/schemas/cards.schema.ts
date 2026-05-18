import {
  FIELDS_REQUIRED,
  INVALID_AMOUNT,
  VISA_OR_MASTERCARD,
} from '@/config/errors';
import { z } from 'zod';

export const createCardSchema = z.object({
  issuer: z.enum(['Visa', 'Mastercard'], {
    message: VISA_OR_MASTERCARD,
  }),
});

export const internalTransferSchema = z
  .object({
    fromType: z.enum(['card', 'account']),
    toType: z.enum(['card', 'account']),
    fromId: z.number().int().positive().optional(),
    toId: z.number().int().positive().optional(),
    amount: z
      .number({ message: FIELDS_REQUIRED })
      .positive({ message: INVALID_AMOUNT }),
  })
  .superRefine((data, ctx) => {
    if (data.fromType === 'card' && !data.fromId) {
      ctx.addIssue({
        code: 'custom' as const,
        message: 'fromId required for card',
        path: ['fromId'],
      });
    }
    if (data.toType === 'card' && !data.toId) {
      ctx.addIssue({
        code: 'custom' as const,
        message: 'toId required for card',
        path: ['toId'],
      });
    }
  });
