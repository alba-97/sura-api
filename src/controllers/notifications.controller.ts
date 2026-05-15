import { Request, Response } from 'express';
import * as notificationsService from '@/services/notifications.service';

export const getNotifications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = await notificationsService.getNotifications(req.user.id);
    res.status(200).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markAllRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await notificationsService.markAllRead(req.user.id);
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
