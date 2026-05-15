if (process.env.NODE_ENV !== 'test') require('dotenv').config({ quiet: true });

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { sequelize, User, Card, Transaction } from './src/models';
import surabankRoutes from './src/routes/surabank';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/surabank', surabankRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

async function seedIfEmpty(): Promise<void> {
  const txCount = await Transaction.count();
  if (txCount > 0) return;

  await User.destroy({ where: {} });
  await Card.destroy({ where: {} });

  const hashed = await bcrypt.hash('SURA2026!$', 10);
  const user = await User.create({
    email: 'user@suragaming.com',
    password: hashed,
    name: 'Carlos Sura',
  });

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
  ]);

  console.log('Database auto-seeded');
}

const start = async (): Promise<void> => {
  await sequelize.sync();
  await seedIfEmpty();
  app.listen(PORT, () => {
    console.log(`SuraBank API running on port ${PORT}`);
  });
};

if (require.main === module) {
  start();
}

export default app;
