import { Notification } from '@/models';

const NOTIFICATION_LIMIT = 8;

export const findNotificationsByUser = (userId: number) =>
  Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: NOTIFICATION_LIMIT,
  });

export const createNotification = (userId: number, message: string) =>
  Notification.create({ userId, message });

export const markAllReadByUser = (userId: number) =>
  Notification.update({ read: true }, { where: { userId, read: false } });
