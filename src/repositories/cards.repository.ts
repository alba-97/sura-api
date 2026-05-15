import { Card, User } from '@/models';

export const findCardsByUser = (userId: number) =>
  Card.findAll({ where: { userId } });

export const findUserById = (id: number) => User.findByPk(id);

export const countCardsByUser = (userId: number) =>
  Card.count({ where: { userId } });

export const findCardById = (id: number, userId: number) =>
  Card.findOne({ where: { id, userId } });

export const createCard = (data: {
  userId: number;
  issuer: string;
  name: string;
  expDate: string;
  lastDigits: number;
  balance: string;
  currency: string;
}) => Card.create(data);
