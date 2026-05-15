import { cacheGet, cacheSet, cacheDel } from '@/repositories/cache';
import * as notificationsRepository from '@/repositories/notifications.repository';

const notifKey = (userId: number) => `sb:notif:${userId}`;

export const getNotifications = async (userId: number) => {
  const cached = await cacheGet(notifKey(userId));
  if (cached) return cached;
  const notifications =
    await notificationsRepository.findNotificationsByUser(userId);
  await cacheSet(notifKey(userId), notifications, 30);
  return notifications;
};

export const markAllRead = async (userId: number) => {
  await notificationsRepository.markAllReadByUser(userId);
  await cacheDel(notifKey(userId));
};

export const createNotification = async (userId: number, message: string) => {
  await notificationsRepository.createNotification(userId, message);
  await cacheDel(notifKey(userId));
};
