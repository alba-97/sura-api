import { Request, Response } from 'express';
import { createCardSchema, internalTransferSchema } from '@/schemas/cards.schema';
import * as cardsService from '@/services/cards.service';
import { AppError } from '@/utils/AppError';

export const getCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await cardsService.getCards(req.user.id);
    res.status(200).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await cardsService.getAccount(req.user.id);
    res.status(200).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCard = async (req: Request, res: Response): Promise<void> => {
  const parsed = createCardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message });
    return;
  }
  try {
    const data = await cardsService.createCard(req.user.id, req.user.name, parsed.data.issuer);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

export const internalTransfer = async (req: Request, res: Response): Promise<void> => {
  const parsed = internalTransferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message });
    return;
  }
  try {
    await cardsService.internalTransfer(req.user.id, parsed.data);
    res.status(200).json({ success: true, message: 'Transfer successful' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};
