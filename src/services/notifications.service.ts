import { cacheGet, cacheSet, cacheDel } from '@/repositories/cache';
import * as notifRepo from '@/repositories/notifications.repository';

const notifKey = (userId: number) => `sb:notif:${userId}`;

export const getNotifications = async (userId: number) => {
  const cached = await cacheGet(notifKey(userId));
  if (cached) return cached;
  const notifications = await notifRepo.findNotificationsByUser(userId);
  await cacheSet(notifKey(userId), notifications, 30);
  return notifications;
};

export const markAllRead = async (userId: number) => {
  await notifRepo.markAllReadByUser(userId);
  await cacheDel(notifKey(userId));
};

export const createNotification = async (userId: number, message: string) => {
  await notifRepo.createNotification(userId, message);
  await cacheDel(notifKey(userId));
};
