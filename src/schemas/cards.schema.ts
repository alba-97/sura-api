import { z } from 'zod';

export const createCardSchema = z.object({
  issuer: z.enum(['Visa', 'Mastercard'], {
    message: 'issuer must be Visa or Mastercard',
  }),
});

export const internalTransferSchema = z
  .object({
    fromType: z.enum(['card', 'account']),
    toType: z.enum(['card', 'account']),
    fromId: z.number().int().positive().optional(),
    toId: z.number().int().positive().optional(),
    amount: z
      .number({ message: 'fromType, toType and amount are required' })
      .positive({ message: 'Invalid amount' }),
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
