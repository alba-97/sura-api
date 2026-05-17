import request from 'supertest';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../src/models', () => ({
  User: { findOne: jest.fn() },
  Card: { findAll: jest.fn() },
  Transaction: { findAll: jest.fn(), count: jest.fn().mockResolvedValue(1) },
  sequelize: { sync: jest.fn().mockResolvedValue(true) },
}));

import app from '../../app';
import bcrypt from 'bcryptjs';
import { User } from '../../src/models';

const mockUser = {
  id: 1,
  name: 'Carlos Sura',
  email: 'user@suragaming.com',
  password: 'hashed_password',
  update: jest.fn().mockResolvedValue(true),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /surabank/login', () => {
  it('returns token on valid credentials', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .post('/surabank/login')
      .send({ email: 'user@suragaming.com', password: 'SURA2026!$' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('name', 'Carlos Sura');
    expect(mockUser.update).toHaveBeenCalled();
  });

  it('returns 401 on invalid password', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/surabank/login')
      .send({ email: 'user@suragaming.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Usuario o contraseña incorrecta');
  });

  it('returns 401 on unknown email', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post('/surabank/login')
      .send({ email: 'nobody@test.com', password: 'SURA2026!$' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Usuario o contraseña incorrecta');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/surabank/login')
      .send({ email: 'user@suragaming.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected error', async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .post('/surabank/login')
      .send({ email: 'user@suragaming.com', password: 'SURA2026!$' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
