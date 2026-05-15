import request from 'supertest';

jest.mock('../../src/models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn() },
  Card: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  Transaction: { findAll: jest.fn(), count: jest.fn().mockResolvedValue(1) },
  sequelize: { sync: jest.fn().mockResolvedValue(true) },
}));

import app from '../../app';
import { User, Card } from '../../src/models';

const VALID_TOKEN = 'test-valid-token';
const mockUser = {
  id: 1,
  name: 'Carlos Sura',
  balance: '1000.00',
  token: VALID_TOKEN,
};

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

const makeMockCard = (overrides = {}) => ({
  id: 1,
  userId: 1,
  balance: '500.00',
  update: jest.fn().mockResolvedValue(true),
  ...overrides,
});

const makeMockUser = (overrides = {}) => ({
  ...mockUser,
  update: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  (Card.findAll as jest.Mock).mockResolvedValue(mockCards);
});

// ── GET /surabank/cards ──────────────────────────────────────────────────────

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

// ── GET /surabank/account ────────────────────────────────────────────────────

describe('GET /surabank/account', () => {
  it('returns account balance for authenticated user', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
    const res = await request(app)
      .get('/surabank/account')
      .set('Authorization', VALID_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('balance', '1000.00');
  });

  it('returns 0.00 when user has no balance field', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .get('/surabank/account')
      .set('Authorization', VALID_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe('0.00');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/surabank/account');
    expect(res.status).toBe(401);
  });

  it('returns 500 on db error', async () => {
    (User.findByPk as jest.Mock).mockRejectedValue(new Error('DB'));
    const res = await request(app)
      .get('/surabank/account')
      .set('Authorization', VALID_TOKEN);
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ── POST /surabank/cards ─────────────────────────────────────────────────────

describe('POST /surabank/cards', () => {
  it('creates a Visa card successfully', async () => {
    (Card.count as jest.Mock).mockResolvedValue(2);
    (Card.create as jest.Mock).mockResolvedValue({
      id: 3,
      issuer: 'Visa',
      userId: 1,
    });

    const res = await request(app)
      .post('/surabank/cards')
      .set('Authorization', VALID_TOKEN)
      .send({ issuer: 'Visa' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.issuer).toBe('Visa');
  });

  it('creates a Mastercard successfully', async () => {
    (Card.count as jest.Mock).mockResolvedValue(0);
    (Card.create as jest.Mock).mockResolvedValue({
      id: 4,
      issuer: 'Mastercard',
      userId: 1,
    });

    const res = await request(app)
      .post('/surabank/cards')
      .set('Authorization', VALID_TOKEN)
      .send({ issuer: 'Mastercard' });

    expect(res.status).toBe(201);
    expect(res.body.data.issuer).toBe('Mastercard');
  });

  it('returns 400 for invalid issuer', async () => {
    const res = await request(app)
      .post('/surabank/cards')
      .set('Authorization', VALID_TOKEN)
      .send({ issuer: 'Amex' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(Card.count).not.toHaveBeenCalled();
  });

  it('returns 400 when issuer is missing', async () => {
    const res = await request(app)
      .post('/surabank/cards')
      .set('Authorization', VALID_TOKEN)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when card limit is reached', async () => {
    (Card.count as jest.Mock).mockResolvedValue(6);

    const res = await request(app)
      .post('/surabank/cards')
      .set('Authorization', VALID_TOKEN)
      .send({ issuer: 'Visa' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 cards/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/surabank/cards')
      .send({ issuer: 'Visa' });
    expect(res.status).toBe(401);
  });

  it('returns 500 on db error', async () => {
    (Card.count as jest.Mock).mockRejectedValue(new Error('DB'));
    const res = await request(app)
      .post('/surabank/cards')
      .set('Authorization', VALID_TOKEN)
      .send({ issuer: 'Visa' });
    expect(res.status).toBe(500);
  });
});

// ── POST /surabank/cards/transfer ────────────────────────────────────────────

describe('POST /surabank/cards/transfer', () => {
  it('transfers from card to account successfully', async () => {
    const srcCard = makeMockCard({ id: 1, balance: '500.00' });
    const usr = makeMockUser({ balance: '1000.00' });
    (Card.findOne as jest.Mock).mockResolvedValue(srcCard);
    (User.findByPk as jest.Mock).mockResolvedValue(usr);

    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'card', fromId: 1, toType: 'account', amount: 100 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(srcCard.update).toHaveBeenCalledWith({ balance: '400.00' });
    expect(usr.update).toHaveBeenCalledWith({ balance: '1100.00' });
  });

  it('transfers from account to card successfully', async () => {
    const usr = makeMockUser({ balance: '1000.00' });
    const dstCard = makeMockCard({ id: 2, balance: '200.00' });
    (User.findByPk as jest.Mock).mockResolvedValue(usr);
    (Card.findOne as jest.Mock).mockResolvedValue(dstCard);

    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'account', toType: 'card', toId: 2, amount: 300 });

    expect(res.status).toBe(200);
    expect(usr.update).toHaveBeenCalledWith({ balance: '700.00' });
    expect(dstCard.update).toHaveBeenCalledWith({ balance: '500.00' });
  });

  it('transfers from card to card successfully', async () => {
    const srcCard = makeMockCard({ id: 1, balance: '500.00' });
    const dstCard = makeMockCard({ id: 2, balance: '100.00' });
    (Card.findOne as jest.Mock)
      .mockResolvedValueOnce(srcCard)
      .mockResolvedValueOnce(dstCard);

    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({
        fromType: 'card',
        fromId: 1,
        toType: 'card',
        toId: 2,
        amount: 50,
      });

    expect(res.status).toBe(200);
    expect(srcCard.update).toHaveBeenCalledWith({ balance: '450.00' });
    expect(dstCard.update).toHaveBeenCalledWith({ balance: '150.00' });
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'card' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid amount', async () => {
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'card', fromId: 1, toType: 'account', amount: -10 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid amount/);
  });

  it('returns 400 for account-to-account transfer', async () => {
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'account', toType: 'account', amount: 50 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for same-card transfer', async () => {
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({
        fromType: 'card',
        fromId: 1,
        toType: 'card',
        toId: 1,
        amount: 50,
      });
    expect(res.status).toBe(400);
  });

  it('returns 400 when fromId is missing for card type', async () => {
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'card', toType: 'account', amount: 50 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when source card not found', async () => {
    (Card.findOne as jest.Mock).mockResolvedValue(null);
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'card', fromId: 99, toType: 'account', amount: 50 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when source card has insufficient funds', async () => {
    (Card.findOne as jest.Mock).mockResolvedValue(
      makeMockCard({ balance: '10.00' }),
    );
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'card', fromId: 1, toType: 'account', amount: 500 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient/);
  });

  it('returns 400 when account has insufficient funds', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(
      makeMockUser({ balance: '5.00' }),
    );
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'account', toType: 'card', toId: 1, amount: 500 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient/);
  });

  it('returns 400 when toId is missing for card destination', async () => {
    const srcCard = makeMockCard({ balance: '500.00' });
    (Card.findOne as jest.Mock).mockResolvedValue(srcCard);
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'card', fromId: 1, toType: 'card', amount: 50 });
    expect(res.status).toBe(400);
  });

  it('returns 404 when destination card not found', async () => {
    const srcCard = makeMockCard({ balance: '500.00' });
    (Card.findOne as jest.Mock)
      .mockResolvedValueOnce(srcCard)
      .mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({
        fromType: 'card',
        fromId: 1,
        toType: 'card',
        toId: 99,
        amount: 50,
      });
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .send({ fromType: 'card', fromId: 1, toType: 'account', amount: 50 });
    expect(res.status).toBe(401);
  });

  it('returns 500 on db error', async () => {
    (Card.findOne as jest.Mock).mockRejectedValue(new Error('DB'));
    const res = await request(app)
      .post('/surabank/cards/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ fromType: 'card', fromId: 1, toType: 'account', amount: 50 });
    expect(res.status).toBe(500);
  });
});
