import { Request, Response, NextFunction } from 'express';
import { User } from '../models';

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.headers['authorization'];

  if (!token) {
    res.status(401).json({ success: false, message: 'Token required' });
    return;
  }

  const user = await User.findOne({ where: { token } });

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  req.user = user;
  next();
};

export default authMiddleware;
