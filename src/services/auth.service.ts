import bcrypt from 'bcryptjs';
import * as authRepository from '@/repositories/auth.repository';
import { HttpError } from '@/utils/HttpError';
import { INVALID_CREDENTIALS } from '@/config/errors';

export const login = async (email: string, password: string) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) throw new HttpError(401, INVALID_CREDENTIALS);

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new HttpError(401, INVALID_CREDENTIALS);

  const token = await authRepository.assignNewToken(user);
  return { name: user.name, token };
};
