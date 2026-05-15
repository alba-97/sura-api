import { randomUUID } from 'crypto';
import { User } from '@/models';

export const findUserByEmail = (email: string) => User.findOne({ where: { email } });

export const assignNewToken = async (user: User): Promise<string> => {
  const token = randomUUID();
  await user.update({ token });
  return token;
};
