import { EMAIL_IS_REQUIRED, PASSWORD_IS_REQUIRED } from '@/config/errors';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, EMAIL_IS_REQUIRED),
  password: z.string().min(1, PASSWORD_IS_REQUIRED),
});
