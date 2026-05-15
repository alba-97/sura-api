import { Router } from 'express';
import { login } from '../controllers/authController';
import {
  getCards,
  getAccount,
  createCard,
  internalTransfer,
} from '../controllers/cardsController';
import {
  getMovements,
  getContacts,
  transfer,
} from '../controllers/movementsController';
import {
  getNotifications,
  markAllRead,
} from '../controllers/notificationsController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/account', authMiddleware, getAccount);
router.get('/cards', authMiddleware, getCards);
router.post('/cards', authMiddleware, createCard);
router.post('/cards/transfer', authMiddleware, internalTransfer);
router.get('/movements', authMiddleware, getMovements);
router.get('/contacts', authMiddleware, getContacts);
router.post('/transfer', authMiddleware, transfer);
router.get('/notifications', authMiddleware, getNotifications);
router.patch('/notifications/read-all', authMiddleware, markAllRead);

export default router;
