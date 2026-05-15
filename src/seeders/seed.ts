import dotenv from 'dotenv';
dotenv.config({quiet: true});

import bcrypt from 'bcryptjs';
import { sequelize, User, Card, Transaction, UserContact } from '../models';

const seed = async (): Promise<void> => {
  await sequelize.sync({ force: true });

  const hashedPassword = await bcrypt.hash('SURA2026!$', 10);

  const user = await User.create({
    email: 'user@suragaming.com',
    password: hashedPassword,
    name: 'Carlos Sura',
  });

  const contactsData = [
    { email: 'camila@example.com', name: 'Camila Montenegro' },
    { email: 'leonardo@example.com', name: 'Leonardo Echazu' },
    { email: 'martin@example.com', name: 'Martin Bozzini' },
    { email: 'valentina@example.com', name: 'Valentina Rios' },
    { email: 'juan@example.com', name: 'Juan Perez' },
  ];

  const contactUsers = await User.bulkCreate(
    contactsData.map((c) => ({
      ...c,
      password: hashedPassword,
    })),
  );

  await UserContact.bulkCreate(
    contactUsers.map((cu) => ({
      userId: user.id,
      contactId: cu.id,
    })),
  );

  await Card.bulkCreate([
    {
      userId: user.id,
      issuer: 'Mastercard',
      name: 'Carlos Sura',
      expDate: '02/30',
      lastDigits: 1234,
      balance: '978.85',
      currency: 'USD',
    },
    {
      userId: user.id,
      issuer: 'Visa',
      name: 'Carlos Sura',
      expDate: '05/28',
      lastDigits: 5678,
      balance: '3241.50',
      currency: 'USD',
    },
  ]);

  await Transaction.bulkCreate([
    {
      userId: user.id,
      title: 'Adobe',
      amount: '$125',
      transactionType: 'SUS',
      date: '2026-05-10',
    },
    {
      userId: user.id,
      title: 'Camila Montenegro',
      amount: '$95',
      transactionType: 'CASH_IN',
      date: '2026-05-09',
    },
    {
      userId: user.id,
      title: 'Figma',
      amount: '$125',
      transactionType: 'SUS',
      date: '2026-05-08',
    },
    {
      userId: user.id,
      title: 'Leonardo Echazu',
      amount: '$95',
      transactionType: 'CASH_OUT',
      date: '2026-05-07',
    },
    {
      userId: user.id,
      title: 'Martin Bozzini',
      amount: '$95',
      transactionType: 'CASH_IN',
      date: '2026-05-06',
    },
    {
      userId: user.id,
      title: 'Netflix',
      amount: '$18',
      transactionType: 'SUS',
      date: '2026-05-05',
    },
    {
      userId: user.id,
      title: 'Valentina Rios',
      amount: '$200',
      transactionType: 'CASH_OUT',
      date: '2026-05-04',
    },
    {
      userId: user.id,
      title: 'Spotify',
      amount: '$12',
      transactionType: 'SUS',
      date: '2026-05-03',
    },
    {
      userId: user.id,
      title: 'Juan Perez',
      amount: '$150',
      transactionType: 'CASH_IN',
      date: '2026-05-02',
    },
  ]);

  console.log('Database seeded successfully');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});