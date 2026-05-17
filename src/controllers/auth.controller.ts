import { Request, Response } from 'express';
import { loginSchema } from '@/schemas/auth.schema';
import * as authService from '@/services/auth.service';
import { HttpError } from '@/utils/HttpError';

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, message: parsed.error.issues[0]?.message });
    return;
  }
  try {
    const data = await authService.login(
      parsed.data.email,
      parsed.data.password,
    );
    res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};
