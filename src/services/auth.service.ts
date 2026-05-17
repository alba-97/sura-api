import bcrypt from 'bcryptjs';
import * as authRepository from '@/repositories/auth.repository';
import { HttpError } from '@/utils/HttpError';

export const login = async (email: string, password: string) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) throw new HttpError(401, 'Usuario o contraseña incorrecta');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new HttpError(401, 'Usuario o contraseña incorrecta');

  const token = await authRepository.assignNewToken(user);
  return { name: user.name, token };
};
