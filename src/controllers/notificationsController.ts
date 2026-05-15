import { Request, Response } from 'express';
import { Notification } from '../models';

export const getNotifications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.status(200).json({ success: true, data: notifications });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markAllRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id, read: false } },
    );
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
