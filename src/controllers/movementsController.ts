import { Request, Response } from 'express';
import { Transaction } from '../models';

export const getLastMovements = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const movements = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    res.status(200).json({ success: true, data: movements });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
