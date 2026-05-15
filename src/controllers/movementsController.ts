import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Transaction, User, UserContact, Card, Notification } from '../models';

export const getMovements = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { search = '', pageNumber = '1' } = req.query as {
      search?: string;
      pageNumber?: string;
    };

    const size = 5;
    const page = Math.max(1, parseInt(pageNumber, 10) || 1);
    const offset = (page - 1) * size;

    const where: Record<string, unknown> = { userId: req.user.id };
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit: size,
      offset,
    });

    res.status(200).json({ success: true, data: rows, total: count });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getContacts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const contactRows = await UserContact.findAll({
      where: { userId: req.user.id },
    });
    const contactIds = contactRows.map((r) => r.contactId);
    const contacts = await User.findAll({
      where: { id: contactIds },
      attributes: ['id', 'email', 'name'],
    });
    res.status(200).json({ success: true, data: contacts });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const transfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, amount, cardId } = req.body as {
      email?: string;
      amount?: string;
      cardId?: number;
    };

    if (!email || !amount || !cardId) {
      res
        .status(400)
        .json({
          success: false,
          message: 'Email, amount and cardId are required',
        });
      return;
    }

    const recipient = await User.findOne({ where: { email } });
    if (!recipient) {
      res
        .status(404)
        .json({
          success: false,
          message: 'User with that email does not exist',
        });
      return;
    }

    if (recipient.id === req.user.id) {
      res
        .status(400)
        .json({ success: false, message: 'Cannot transfer to yourself' });
      return;
    }

    const card = await Card.findOne({
      where: { id: cardId, userId: req.user.id },
    });
    if (!card) {
      res.status(404).json({ success: false, message: 'Card not found' });
      return;
    }

    const amountNum = parseFloat(amount);
    const currentBalance = parseFloat(card.balance);
    if (isNaN(amountNum) || amountNum <= 0) {
      res.status(400).json({ success: false, message: 'Invalid amount' });
      return;
    }
    if (amountNum > currentBalance) {
      res.status(400).json({ success: false, message: 'Insufficient funds' });
      return;
    }

    const newBalance = (currentBalance - amountNum).toFixed(2);
    await card.update({ balance: newBalance });

    const senderName = req.user.name;
    const recipientName = recipient.name;

    const now = new Date().toISOString().split('T')[0];

    await Transaction.create({
      userId: req.user.id,
      title: recipientName,
      amount: `$${amountNum.toFixed(2)}`,
      transactionType: 'CASH_OUT',
      date: now,
    });

    await Transaction.create({
      userId: recipient.id,
      title: senderName,
      amount: `$${amountNum.toFixed(2)}`,
      transactionType: 'CASH_IN',
      date: now,
    });

    await Notification.create({
      userId: recipient.id,
      message: `Recibiste $${amountNum.toFixed(2)} de ${senderName}`,
    });

    const existingContact = await UserContact.findOne({
      where: { userId: req.user.id, contactId: recipient.id },
    });

    if (!existingContact) {
      const contactCount = await UserContact.count({
        where: { userId: req.user.id },
      });

      if (contactCount >= 7) {
        const oldest = await UserContact.findOne({
          where: { userId: req.user.id },
          order: [['createdAt', 'ASC']],
        });
        if (oldest) await oldest.destroy();
      }

      await UserContact.create({
        userId: req.user.id,
        contactId: recipient.id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transfer successful',
      data: {
        newBalance,
        cardId: card.id,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
