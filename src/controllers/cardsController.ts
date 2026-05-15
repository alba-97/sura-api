import { Request, Response } from 'express';
import { Card } from '../models';

export const getCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = await Card.findAll({ where: { userId: req.user.id } });
    res.status(200).json({ success: true, data: cards });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
