import request from 'supertest';

jest.mock('../../src/models', () => ({
  User: { findOne: jest.fn() },
  Card: { findAll: jest.fn() },
  Transaction: { findAll: jest.fn(), count: jest.fn().mockResolvedValue(1) },
  sequelize: { sync: jest.fn().mockResolvedValue(true) },
}));

import app from '../../app';
import { User, Transaction } from '../../src/models';

const VALID_TOKEN = 'test-valid-token';
const mockUser = { id: 1, name: 'Carlos Sura', token: VALID_TOKEN };

const mockMovements = [
  {
    id: 1,
    userId: 1,
    title: 'Adobe',
    amount: '$125',
    transactionType: 'SUS',
    date: '2026-05-10',
  },
  {
    id: 2,
    userId: 1,
    title: 'Camila Montenegro',
    amount: '$95',
    transactionType: 'CASH_IN',
    date: '2026-05-09',
  },
  {
    id: 3,
    userId: 1,
    title: 'Figma',
    amount: '$125',
    transactionType: 'SUS',
    date: '2026-05-08',
  },
  {
    id: 4,
    userId: 1,
    title: 'Leonardo Echazu',
    amount: '$95',
    transactionType: 'CASH_OUT',
    date: '2026-05-07',
  },
  {
    id: 5,
    userId: 1,
    title: 'Martin Bozzini',
    amount: '$95',
    transactionType: 'CASH_IN',
    date: '2026-05-06',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  (Transaction.findAll as jest.Mock).mockResolvedValue(mockMovements);
});

describe('GET /surabank/movements/last', () => {
  it('returns last 5 movements for authenticated user', async () => {
    const res = await request(app)
      .get('/surabank/movements/last')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);
  });

  it('transaction entity has required fields', async () => {
    const res = await request(app)
      .get('/surabank/movements/last')
      .set('Authorization', VALID_TOKEN);

    const tx = res.body.data[0];
    expect(tx).toHaveProperty('id');
    expect(tx).toHaveProperty('title');
    expect(tx).toHaveProperty('amount');
    expect(tx).toHaveProperty('transactionType');
    expect(tx).toHaveProperty('date');
    expect(['SUS', 'CASH_IN', 'CASH_OUT']).toContain(tx.transactionType);
  });

  it('calls findAll with limit 5 and correct userId', async () => {
    await request(app)
      .get('/surabank/movements/last')
      .set('Authorization', VALID_TOKEN);

    expect(Transaction.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: mockUser.id }, limit: 5 }),
    );
  });

  it('does not return more than 5 movements', async () => {
    const res = await request(app)
      .get('/surabank/movements/last')
      .set('Authorization', VALID_TOKEN);

    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/surabank/movements/last');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(Transaction.findAll).not.toHaveBeenCalled();
  });

  it('returns 401 with invalid token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/surabank/movements/last')
      .set('Authorization', 'bogus');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 on db error', async () => {
    (Transaction.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .get('/surabank/movements/last')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
