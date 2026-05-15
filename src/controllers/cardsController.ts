import { Request, Response } from 'express';
import { Card, User } from '../models';

export const getCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = await Card.findAll({ where: { userId: req.user.id } });
    res.status(200).json({ success: true, data: cards });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findByPk(req.user.id);
    res
      .status(200)
      .json({ success: true, data: { balance: user?.balance ?? '0.00' } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCard = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { issuer } = req.body as { issuer?: string };
    if (!issuer || !['Visa', 'Mastercard'].includes(issuer)) {
      res
        .status(400)
        .json({ success: false, message: 'issuer must be Visa or Mastercard' });
      return;
    }

    const cardCount = await Card.count({ where: { userId: req.user.id } });
    if (cardCount >= 6) {
      res
        .status(400)
        .json({ success: false, message: 'Maximum 6 cards allowed per user' });
      return;
    }

    const lastDigits = Math.floor(1000 + Math.random() * 9000);
    const month = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
    const year = String(27 + Math.floor(Math.random() * 6));

    const card = await Card.create({
      userId: req.user.id,
      issuer,
      name: req.user.name,
      expDate: `${month}/${year}`,
      lastDigits,
      balance: '0.00',
      currency: 'USD',
    });

    res.status(201).json({ success: true, data: card });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const internalTransfer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { fromType, fromId, toType, toId, amount } = req.body as {
      fromType?: string;
      fromId?: number;
      toType?: string;
      toId?: number;
      amount?: number;
    };

    if (!fromType || !toType || !amount) {
      res
        .status(400)
        .json({
          success: false,
          message: 'fromType, toType and amount are required',
        });
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      res.status(400).json({ success: false, message: 'Invalid amount' });
      return;
    }

    if (fromType === 'account' && toType === 'account') {
      res
        .status(400)
        .json({
          success: false,
          message: 'Cannot transfer from account to account',
        });
      return;
    }

    if (fromType === 'card' && toType === 'card' && fromId === toId) {
      res
        .status(400)
        .json({ success: false, message: 'Cannot transfer to the same card' });
      return;
    }

    // Deduct from source
    if (fromType === 'card') {
      if (!fromId) {
        res
          .status(400)
          .json({ success: false, message: 'fromId required for card' });
        return;
      }
      const src = await Card.findOne({
        where: { id: fromId, userId: req.user.id },
      });
      if (!src) {
        res
          .status(404)
          .json({ success: false, message: 'Source card not found' });
        return;
      }
      const bal = parseFloat(src.balance);
      if (amountNum > bal) {
        res.status(400).json({ success: false, message: 'Insufficient funds' });
        return;
      }
      await src.update({ balance: (bal - amountNum).toFixed(2) });
    } else {
      const usr = await User.findByPk(req.user.id);
      if (!usr) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      const bal = parseFloat(usr.balance);
      if (amountNum > bal) {
        res.status(400).json({ success: false, message: 'Insufficient funds' });
        return;
      }
      await usr.update({ balance: (bal - amountNum).toFixed(2) });
    }

    // Add to destination
    if (toType === 'card') {
      if (!toId) {
        res
          .status(400)
          .json({ success: false, message: 'toId required for card' });
        return;
      }
      const dst = await Card.findOne({
        where: { id: toId, userId: req.user.id },
      });
      if (!dst) {
        res
          .status(404)
          .json({ success: false, message: 'Destination card not found' });
        return;
      }
      await dst.update({
        balance: (parseFloat(dst.balance) + amountNum).toFixed(2),
      });
    } else {
      const usr = await User.findByPk(req.user.id);
      if (!usr) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      await usr.update({
        balance: (parseFloat(usr.balance) + amountNum).toFixed(2),
      });
    }

    res.status(200).json({ success: true, message: 'Transfer successful' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
