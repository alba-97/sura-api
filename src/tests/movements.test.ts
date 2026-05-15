import request from 'supertest';

jest.mock('../../src/models', () => ({
  User: { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn() },
  Card: { findAll: jest.fn(), findOne: jest.fn() },
  Transaction: { findAndCountAll: jest.fn(), create: jest.fn() },
  UserContact: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  Notification: { create: jest.fn().mockResolvedValue({}) },
  sequelize: { sync: jest.fn().mockResolvedValue(true) },
}));

import app from '../../app';
import { User, Transaction, UserContact, Card } from '../../src/models';

const VALID_TOKEN = 'test-valid-token';
const mockUser = {
  id: 1,
  name: 'Carlos Sura',
  token: VALID_TOKEN,
  balance: '1000.00',
  update: jest.fn().mockResolvedValue(true),
};
const mockRecipient = {
  id: 2,
  name: 'Camila Montenegro',
  email: 'camila@test.com',
  balance: '500.00',
  update: jest.fn().mockResolvedValue(true),
};

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
];

const makeMockCard = (overrides = {}) => ({
  id: 1,
  userId: 1,
  balance: '500.00',
  update: jest.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.update = jest.fn().mockResolvedValue(true);
  mockRecipient.update = jest.fn().mockResolvedValue(true);
  (User.findOne as jest.Mock).mockImplementation(
    ({ where }: { where: Record<string, unknown> }) => {
      if (where.token) return Promise.resolve(mockUser);
      if (where.email) return Promise.resolve(mockRecipient);
      return Promise.resolve(null);
    },
  );
  (Transaction.findAndCountAll as jest.Mock).mockResolvedValue({
    rows: mockMovements,
    count: 5,
  });
  (Transaction.create as jest.Mock).mockResolvedValue({});
  (UserContact.findAll as jest.Mock).mockResolvedValue([]);
  (UserContact.findOne as jest.Mock).mockResolvedValue(null);
  (UserContact.count as jest.Mock).mockResolvedValue(0);
  (UserContact.create as jest.Mock).mockResolvedValue({});
  (User.findAll as jest.Mock).mockResolvedValue([mockRecipient]);
  (Card.findOne as jest.Mock).mockResolvedValue(makeMockCard());
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
      expect.objectContaining({
        where: { userId: mockUser.id },
        limit: 5,
        offset: 0,
      }),
    );
  });

  it('applies pagination correctly for page 2', async () => {
    await request(app)
      .get('/surabank/movements?pageNumber=2')
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
          title: expect.anything(),
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
  });

  it('returns 500 on db error', async () => {
    (Transaction.findAndCountAll as jest.Mock).mockRejectedValue(
      new Error('DB error'),
    );
    const res = await request(app)
      .get('/surabank/movements')
      .set('Authorization', VALID_TOKEN);
    expect(res.status).toBe(500);
  });
});

describe('GET /surabank/contacts', () => {
  it('returns contact list for authenticated user', async () => {
    (UserContact.findAll as jest.Mock).mockResolvedValue([{ contactId: 2 }]);
    (User.findAll as jest.Mock).mockResolvedValue([mockRecipient]);

    const res = await request(app)
      .get('/surabank/contacts')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('email', 'camila@test.com');
  });

  it('returns empty list when user has no contacts', async () => {
    (UserContact.findAll as jest.Mock).mockResolvedValue([]);
    (User.findAll as jest.Mock).mockResolvedValue([]);

    const res = await request(app)
      .get('/surabank/contacts')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/surabank/contacts');
    expect(res.status).toBe(401);
  });

  it('returns 500 on db error', async () => {
    (UserContact.findAll as jest.Mock).mockRejectedValue(new Error('DB'));
    const res = await request(app)
      .get('/surabank/contacts')
      .set('Authorization', VALID_TOKEN);
    expect(res.status).toBe(500);
  });
});

describe('POST /surabank/transfer', () => {
  it('transfers money successfully and creates contact', async () => {
    const card = makeMockCard({ balance: '500.00' });
    (Card.findOne as jest.Mock).mockResolvedValue(card);
    (UserContact.count as jest.Mock).mockResolvedValue(2);

    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'camila@test.com', amount: 100, cardId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.newBalance).toBe('400.00');
    expect(card.update).toHaveBeenCalledWith({ balance: '400.00' });
    expect(Transaction.create).toHaveBeenCalledTimes(2);
    expect(UserContact.create).toHaveBeenCalled();
  });

  it('does not duplicate existing contact', async () => {
    const card = makeMockCard({ balance: '500.00' });
    (Card.findOne as jest.Mock).mockResolvedValue(card);
    (UserContact.findOne as jest.Mock).mockResolvedValue({
      id: 10,
      userId: 1,
      contactId: 2,
    });

    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'camila@test.com', amount: 50, cardId: 1 });

    expect(res.status).toBe(200);
    expect(UserContact.create).not.toHaveBeenCalled();
  });

  it('evicts oldest contact when list is full (>= 7)', async () => {
    const card = makeMockCard({ balance: '500.00' });
    const oldest = { id: 5, destroy: jest.fn().mockResolvedValue(true) };
    (Card.findOne as jest.Mock).mockResolvedValue(card);
    (UserContact.count as jest.Mock).mockResolvedValue(7);
    (UserContact.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(oldest);

    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'camila@test.com', amount: 50, cardId: 1 });

    expect(res.status).toBe(200);
    expect(oldest.destroy).toHaveBeenCalled();
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'camila@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 when recipient email does not exist', async () => {
    (User.findOne as jest.Mock).mockImplementation(
      ({ where }: { where: Record<string, unknown> }) => {
        if (where.token) return Promise.resolve(mockUser);
        return Promise.resolve(null);
      },
    );

    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'nobody@test.com', amount: 50, cardId: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/does not exist/);
  });

  it('returns 400 when transferring to yourself', async () => {
    (User.findOne as jest.Mock).mockImplementation(
      ({ where }: { where: Record<string, unknown> }) => {
        if (where.token) return Promise.resolve(mockUser);
        if (where.email)
          return Promise.resolve({ ...mockUser, email: 'self@test.com' });
        return Promise.resolve(null);
      },
    );

    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'self@test.com', amount: 50, cardId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/yourself/);
  });

  it('returns 404 when card not found', async () => {
    (Card.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'camila@test.com', amount: 50, cardId: 99 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Card not found/);
  });

  it('returns 400 for invalid amount', async () => {
    (Card.findOne as jest.Mock).mockResolvedValue(
      makeMockCard({ balance: '500.00' }),
    );

    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'camila@test.com', amount: -50, cardId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid amount/);
  });

  it('returns 400 when card has insufficient funds', async () => {
    (Card.findOne as jest.Mock).mockResolvedValue(
      makeMockCard({ balance: '10.00' }),
    );

    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'camila@test.com', amount: 500, cardId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/surabank/transfer')
      .send({ email: 'camila@test.com', amount: 50, cardId: 1 });
    expect(res.status).toBe(401);
  });

  it('returns 500 on db error', async () => {
    (Card.findOne as jest.Mock).mockRejectedValue(new Error('DB'));
    const res = await request(app)
      .post('/surabank/transfer')
      .set('Authorization', VALID_TOKEN)
      .send({ email: 'camila@test.com', amount: 50, cardId: 1 });
    expect(res.status).toBe(500);
  });
});
