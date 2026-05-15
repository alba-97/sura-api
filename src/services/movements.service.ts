import { AppError } from '@/utils/AppError';
import { cacheGet, cacheSet, cacheDel, cacheIncr, cacheGetNum } from '@/repositories/cache';
import * as movRepo from '@/repositories/movements.repository';
import * as notificationsService from '@/services/notifications.service';
import type { TransactionType } from '@/models/Transaction';

const movVersionKey = (userId: number) => `sb:mov_v:${userId}`;
const movKey = (userId: number, version: string, page: number, search: string) =>
  `sb:mov:${userId}:${version}:${page}:${search}`;
const contactsKey = (userId: number) => `sb:ctcts:${userId}`;

export const getMovements = async (userId: number, page: number, search: string) => {
  const version = await cacheGetNum(movVersionKey(userId));
  const key = movKey(userId, version, page, search);
  const cached = await cacheGet<{ data: unknown[]; total: number }>(key);
  if (cached) return cached;

  const { count, rows } = await movRepo.findAndCountTransactions(userId, page, search);
  const result = { data: rows, total: count };
  await cacheSet(key, result, 30);
  return result;
};

export const getContacts = async (userId: number) => {
  const cached = await cacheGet(contactsKey(userId));
  if (cached) return cached;

  const ids = await movRepo.findContactIdsByUser(userId);
  const contacts = await movRepo.findUsersByIds(ids);
  await cacheSet(contactsKey(userId), contacts, 120);
  return contacts;
};

export const transfer = async (
  userId: number,
  userName: string,
  email: string,
  amount: string,
  cardId: number,
) => {
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new AppError(400, 'Invalid amount');

  const recipient = await movRepo.findUserByEmail(email);
  if (!recipient) throw new AppError(404, 'User with that email does not exist');
  if (recipient.id === userId) throw new AppError(400, 'Cannot transfer to yourself');

  const card = await movRepo.findCardById(cardId, userId);
  if (!card) throw new AppError(404, 'Card not found');

  const currentBalance = parseFloat(card.balance);
  if (amountNum > currentBalance) throw new AppError(400, 'Insufficient funds');

  const newBalance = (currentBalance - amountNum).toFixed(2);
  await card.update({ balance: newBalance });

  const now = new Date().toISOString().split('T')[0];
  await movRepo.createTransaction({
    userId,
    title: recipient.name,
    amount: `$${amountNum.toFixed(2)}`,
    transactionType: 'CASH_OUT' as TransactionType,
    date: now,
  });
  await movRepo.createTransaction({
    userId: recipient.id,
    title: userName,
    amount: `$${amountNum.toFixed(2)}`,
    transactionType: 'CASH_IN' as TransactionType,
    date: now,
  });

  await notificationsService.createNotification(
    recipient.id,
    `Recibiste $${amountNum.toFixed(2)} de ${userName}`,
  );

  const existing = await movRepo.findContactByUsers(userId, recipient.id);
  if (!existing) {
    const count = await movRepo.countContactsByUser(userId);
    if (count >= 7) {
      const oldest = await movRepo.findOldestContact(userId);
      if (oldest) await movRepo.destroyContact(oldest);
    }
    await movRepo.createContact(userId, recipient.id);
  }

  await cacheIncr(movVersionKey(userId));
  await cacheIncr(movVersionKey(recipient.id));
  await cacheDel(contactsKey(userId));

  return { newBalance, cardId: card.id };
};
