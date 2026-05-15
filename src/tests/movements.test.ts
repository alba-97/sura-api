import request from 'supertest';

jest.mock('../../src/models', () => ({
  User: { findOne: jest.fn() },
  Card: { findAll: jest.fn() },
  Transaction: { findAndCountAll: jest.fn() },
  sequelize: { sync: jest.fn().mockResolvedValue(true) },
}));

import app from '../../app';
import { User, Transaction } from '../../src/models';

const VALID_TOKEN = 'test-valid-token';
const mockUser = { id: 1, name: 'Carlos Sura', token: VALID_TOKEN };

const mockMovements = [
  { id: 1, userId: 1, title: 'Adobe', amount: '$125', transactionType: 'SUS', date: '2026-05-10' },
  { id: 2, userId: 1, title: 'Camila Montenegro', amount: '$95', transactionType: 'CASH_IN', date: '2026-05-09' },
  { id: 3, userId: 1, title: 'Figma', amount: '$125', transactionType: 'SUS', date: '2026-05-08' },
  { id: 4, userId: 1, title: 'Leonardo Echazu', amount: '$95', transactionType: 'CASH_OUT', date: '2026-05-07' },
];

beforeEach(() => {
  jest.clearAllMocks();
  (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  (Transaction.findAndCountAll as jest.Mock).mockResolvedValue({
    rows: mockMovements,
    count: 5,
  });
});

describe('GET /surabank/movements', () => {
  it('returns paginated movements with total for authenticated user', async () => {
    const res = await request(app)
      .get('/surabank/movements')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('transaction entity has required fields', async () => {
    (Transaction.findAndCountAll as jest.Mock).mockResolvedValue({
      rows: mockMovements.slice(0, 1),
      count: 1,
    });

    const res = await request(app)
      .get('/surabank/movements')
      .set('Authorization', VALID_TOKEN);

    const tx = res.body.data[0];
    expect(tx).toHaveProperty('id');
    expect(tx).toHaveProperty('title');
    expect(tx).toHaveProperty('amount');
    expect(tx).toHaveProperty('transactionType');
    expect(tx).toHaveProperty('date');
    expect(['SUS', 'CASH_IN', 'CASH_OUT']).toContain(tx.transactionType);
  });

  it('calls findAndCountAll with default pageSize 5, offset 0 and correct userId', async () => {
    await request(app)
      .get('/surabank/movements')
      .set('Authorization', VALID_TOKEN);

    expect(Transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: mockUser.id }, limit: 5, offset: 0 }),
    );
  });

  it('applies pagination correctly for page 2', async () => {
    await request(app)
      .get('/surabank/movements?pageNumber=2&pageSize=5')
      .set('Authorization', VALID_TOKEN);

    expect(Transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5, offset: 5 }),
    );
  });

  it('applies text search filter on title', async () => {
    await request(app)
      .get('/surabank/movements?search=Adobe')
      .set('Authorization', VALID_TOKEN);

    expect(Transaction.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: mockUser.id,
          title: expect.objectContaining({}),
        }),
      }),
    );
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/surabank/movements');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(Transaction.findAndCountAll).not.toHaveBeenCalled();
  });

  it('returns 401 with invalid token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/surabank/movements')
      .set('Authorization', 'bogus');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 on db error', async () => {
    (Transaction.findAndCountAll as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .get('/surabank/movements')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
