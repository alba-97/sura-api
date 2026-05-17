import { Request, Response } from 'express';
import { transferSchema, getMovementsSchema } from '@/schemas/movements.schema';
import * as movementsService from '@/services/movements.service';
import { HttpError } from '@/utils/HttpError';

export const getMovements = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parsed = getMovementsSchema.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, message: parsed.error.issues[0]?.message });
    return;
  }
  try {
    const { pageNumber, search = '' } = parsed.data;
    const result = await movementsService.getMovements(
      req.user.id,
      pageNumber,
      search,
    );
    res.status(200).json({ success: true, ...(result as object) });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getContacts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = await movementsService.getContacts(req.user.id);
    res.status(200).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const transfer = async (req: Request, res: Response): Promise<void> => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ success: false, message: parsed.error.issues[0]?.message });
    return;
  }
  try {
    const { email, amount, cardId } = parsed.data;
    const data = await movementsService.transfer(
      req.user.id,
      req.user.name,
      email,
      amount,
      cardId,
    );
    res
      .status(200)
      .json({ success: true, message: 'Transfer successful', data });
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};
