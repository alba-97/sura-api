import { Op } from 'sequelize';
import { Card, Transaction, User, UserContact } from '@/models';
import type { TransactionType } from '@/models/Transaction';

export const findAndCountTransactions = (
  userId: number,
  page: number,
  search: string,
) => {
  const size = 5;
  const offset = (page - 1) * size;
  const where: Record<string, unknown> = { userId };
  if (search) where.title = { [Op.iLike]: `%${search}%` };
  return Transaction.findAndCountAll({
    where,
    order: [['date', 'DESC']],
    limit: size,
    offset,
  });
};

export const findContactIdsByUser = async (userId: number) => {
  const rows = await UserContact.findAll({ where: { userId } });
  return rows.map((r) => r.contactId);
};

export const findUsersByIds = (ids: number[]) =>
  User.findAll({ where: { id: ids }, attributes: ['id', 'email', 'name'] });

export const findUserByEmail = (email: string) =>
  User.findOne({ where: { email } });

export const findCardById = (id: number, userId: number) =>
  Card.findOne({ where: { id, userId } });

export const createTransaction = (data: {
  userId: number;
  title: string;
  amount: string;
  transactionType: TransactionType;
  date: string;
}) => Transaction.create(data);

export const findContactByUsers = (userId: number, contactId: number) =>
  UserContact.findOne({ where: { userId, contactId } });

export const countContactsByUser = (userId: number) =>
  UserContact.count({ where: { userId } });

export const findOldestContact = (userId: number) =>
  UserContact.findOne({ where: { userId }, order: [['createdAt', 'ASC']] });

export const createContact = (userId: number, contactId: number) =>
  UserContact.create({ userId, contactId });

export const destroyContact = (contact: { destroy: () => Promise<unknown> }) =>
  contact.destroy();
