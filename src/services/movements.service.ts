import { HttpError } from '@/utils/HttpError';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheIncr,
  cacheGetNum,
} from '@/repositories/cache';
import * as movementsRepository from '@/repositories/movements.repository';
import * as notificationsService from '@/services/notifications.service';
import type { TransactionType } from '@/models/Transaction';
import {
  CANNOT_TRANSFER_TO_SELF,
  CARD_NOT_FOUND,
  INSUFFICIENT_FUNDS,
  INVALID_AMOUNT,
  USER_WITH_EMAIL_NOT_EXIST,
} from '@/config/errors';

const movVersionKey = (userId: number) => `sb:mov_v:${userId}`;
const movKey = (
  userId: number,
  version: string,
  page: number,
  search: string,
) => `sb:mov:${userId}:${version}:${page}:${search}`;
const contactsKey = (userId: number) => `sb:ctcts:${userId}`;

export const getMovements = async (
  userId: number,
  page: number,
  search: string,
) => {
  const version = await cacheGetNum(movVersionKey(userId));
  const key = movKey(userId, version, page, search);
  const cached = await cacheGet<{ data: unknown[]; total: number }>(key);
  if (cached) return cached;

  const { count, rows } = await movementsRepository.findAndCountTransactions(
    userId,
    page,
    search,
  );
  const result = { data: rows, total: count };
  await cacheSet(key, result, 30);
  return result;
};

export const getContacts = async (userId: number) => {
  const cached = await cacheGet(contactsKey(userId));
  if (cached) return cached;

  const ids = await movementsRepository.findContactIdsByUser(userId);
  const contacts = await movementsRepository.findUsersByIds(ids);
  await cacheSet(contactsKey(userId), contacts, 120);
  return contacts;
};

export const transfer = async (
  userId: number,
  userName: string,
  email: string,
  amount: number,
  cardId: number,
) => {
  if (isNaN(amount) || amount <= 0) throw new HttpError(400, INVALID_AMOUNT);

  const recipient = await movementsRepository.findUserByEmail(email);
  if (!recipient) throw new HttpError(404, USER_WITH_EMAIL_NOT_EXIST);
  if (recipient.id === userId)
    throw new HttpError(400, CANNOT_TRANSFER_TO_SELF);

  const card = await movementsRepository.findCardById(cardId, userId);
  if (!card) throw new HttpError(404, CARD_NOT_FOUND);

  const currentBalance = parseFloat(card.balance);
  if (amount > currentBalance) throw new HttpError(400, INSUFFICIENT_FUNDS);

  const newBalance = (currentBalance - amount).toFixed(2);
  await card.update({ balance: newBalance });

  const recipientBalance = (parseFloat(recipient.balance) + amount).toFixed(2);
  await recipient.update({ balance: recipientBalance });

  const now = new Date().toISOString().split('T')[0];
  await movementsRepository.createTransaction({
    userId,
    title: recipient.name,
    amount: `$${amount.toFixed(2)}`,
    transactionType: 'CASH_OUT' as TransactionType,
    date: now,
  });
  await movementsRepository.createTransaction({
    userId: recipient.id,
    title: userName,
    amount: `$${amount.toFixed(2)}`,
    transactionType: 'CASH_IN' as TransactionType,
    date: now,
  });

  await notificationsService.createNotification(
    recipient.id,
    `Recibiste $${amount.toFixed(2)} de ${userName}`,
  );

  const existing = await movementsRepository.findContactByUsers(
    userId,
    recipient.id,
  );
  if (!existing) {
    const count = await movementsRepository.countContactsByUser(userId);
    if (count >= 7) {
      const oldest = await movementsRepository.findOldestContact(userId);
      if (oldest) await movementsRepository.destroyContact(oldest);
    }
    await movementsRepository.createContact(userId, recipient.id);
  }

  await cacheIncr(movVersionKey(userId));
  await cacheIncr(movVersionKey(recipient.id));
  await cacheDel(contactsKey(userId));

  return { newBalance, cardId: card.id };
};
