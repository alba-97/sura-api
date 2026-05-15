import bcrypt from 'bcryptjs';
import { AppError } from '@/utils/AppError';
import * as authRepository from '@/repositories/auth.repository';

export const login = async (email: string, password: string) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) throw new AppError(401, 'Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new AppError(401, 'Invalid credentials');

  const token = await authRepository.assignNewToken(user);
  return { name: user.name, token };
};
