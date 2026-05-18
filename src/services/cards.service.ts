import { HttpError } from '@/utils/HttpError';
import { cacheGet, cacheSet, cacheDel } from '@/repositories/cache';
import {
  MAX_CARDS,
  CANNOT_TRANSFER_ACCOUNT_TO_ACCOUNT,
  CANNOT_TRANSFER_TO_SAME_CARD,
  SOURCE_CARD_NOT_FOUND,
  INSUFFICIENT_FUNDS,
  USER_NOT_FOUND,
  DESTINATION_CARD_NOT_FOUND,
} from '@/config/errors';
import * as cardsRepository from '@/repositories/cards.repository';

const cardsKey = (userId: number) => `sb:cards:${userId}`;
const accountKey = (userId: number) => `sb:acct:${userId}`;

export const getCards = async (userId: number) => {
  const cached = await cacheGet(cardsKey(userId));
  if (cached) return cached;
  const cards = await cardsRepository.findCardsByUser(userId);
  await cacheSet(cardsKey(userId), cards, 60);
  return cards;
};

export const getAccount = async (userId: number) => {
  const cached = await cacheGet<{ balance: string }>(accountKey(userId));
  if (cached) return cached;
  const user = await cardsRepository.findUserById(userId);
  const data = { balance: user?.balance ?? '0.00' };
  await cacheSet(accountKey(userId), data, 60);
  return data;
};

export const createCard = async (
  userId: number,
  userName: string,
  issuer: string,
) => {
  const count = await cardsRepository.countCardsByUser(userId);
  if (count >= 6) throw new HttpError(400, MAX_CARDS);

  const lastDigits = Math.floor(1000 + Math.random() * 9000);
  const month = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
  const year = String(27 + Math.floor(Math.random() * 6));

  const card = await cardsRepository.createCard({
    userId,
    issuer,
    name: userName,
    expDate: `${month}/${year}`,
    lastDigits,
    balance: '0.00',
    currency: 'USD',
  });
  await cacheDel(cardsKey(userId));
  return card;
};

export const internalTransfer = async (
  userId: number,
  body: {
    fromType: string;
    fromId?: number;
    toType: string;
    toId?: number;
    amount: number;
  },
) => {
  const { fromType, fromId, toType, toId, amount } = body;

  if (fromType === 'account' && toType === 'account') {
    throw new HttpError(400, CANNOT_TRANSFER_ACCOUNT_TO_ACCOUNT);
  }
  if (fromType === 'card' && toType === 'card' && fromId === toId) {
    throw new HttpError(400, CANNOT_TRANSFER_TO_SAME_CARD);
  }

  if (fromType === 'card') {
    const src = await cardsRepository.findCardById(fromId!, userId);
    if (!src) throw new HttpError(404, SOURCE_CARD_NOT_FOUND);
    if (amount > parseFloat(src.balance))
      throw new HttpError(400, INSUFFICIENT_FUNDS);
    await src.update({
      balance: (parseFloat(src.balance) - amount).toFixed(2),
    });
  } else {
    const usr = await cardsRepository.findUserById(userId);
    if (!usr) throw new HttpError(404, USER_NOT_FOUND);
    if (amount > parseFloat(usr.balance))
      throw new HttpError(400, INSUFFICIENT_FUNDS);
    await usr.update({
      balance: (parseFloat(usr.balance) - amount).toFixed(2),
    });
  }

  if (toType === 'card') {
    const dst = await cardsRepository.findCardById(toId!, userId);
    if (!dst) throw new HttpError(404, DESTINATION_CARD_NOT_FOUND);
    await dst.update({
      balance: (parseFloat(dst.balance) + amount).toFixed(2),
    });
  } else {
    const usr = await cardsRepository.findUserById(userId);
    if (!usr) throw new HttpError(404, USER_NOT_FOUND);
    await usr.update({
      balance: (parseFloat(usr.balance) + amount).toFixed(2),
    });
  }

  await cacheDel(cardsKey(userId), accountKey(userId));
};
