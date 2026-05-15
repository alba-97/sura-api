import request from 'supertest';

jest.mock('../../src/models', () => ({
  User: { findOne: jest.fn() },
  Card: { findAll: jest.fn() },
  Transaction: { findAll: jest.fn(), count: jest.fn().mockResolvedValue(1) },
  sequelize: { sync: jest.fn().mockResolvedValue(true) },
}));

import app from '../../app';
import { User, Card } from '../../src/models';

const VALID_TOKEN = 'test-valid-token';
const mockUser = { id: 1, name: 'Carlos Sura', token: VALID_TOKEN };

const mockCards = [
  {
    id: 1,
    userId: 1,
    issuer: 'Mastercard',
    name: 'Carlos Sura',
    expDate: '02/30',
    lastDigits: 1234,
    balance: '978.85',
    currency: 'USD',
  },
  {
    id: 2,
    userId: 1,
    issuer: 'Visa',
    name: 'Carlos Sura',
    expDate: '05/28',
    lastDigits: 5678,
    balance: '3241.50',
    currency: 'USD',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  (Card.findAll as jest.Mock).mockResolvedValue(mockCards);
});

describe('GET /surabank/cards', () => {
  it('returns cards for authenticated user', async () => {
    const res = await request(app)
      .get('/surabank/cards')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    const issuers = res.body.data.map((c: { issuer: string }) => c.issuer);
    expect(issuers).toContain('Mastercard');
    expect(issuers).toContain('Visa');
  });

  it('card entity has required fields', async () => {
    const res = await request(app)
      .get('/surabank/cards')
      .set('Authorization', VALID_TOKEN);

    const card = res.body.data[0];
    expect(card).toHaveProperty('id');
    expect(card).toHaveProperty('issuer');
    expect(card).toHaveProperty('name');
    expect(card).toHaveProperty('expDate');
    expect(card).toHaveProperty('lastDigits');
    expect(card).toHaveProperty('balance');
    expect(card).toHaveProperty('currency');
  });

  it('calls findAll with the authenticated user id', async () => {
    await request(app).get('/surabank/cards').set('Authorization', VALID_TOKEN);

    expect(Card.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: mockUser.id } }),
    );
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/surabank/cards');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(Card.findAll).not.toHaveBeenCalled();
  });

  it('returns 401 with invalid token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .get('/surabank/cards')
      .set('Authorization', 'bogus-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 on db error', async () => {
    (Card.findAll as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .get('/surabank/cards')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
