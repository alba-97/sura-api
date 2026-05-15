import { Router } from 'express';
import { login } from '../controllers/authController';
import { getCards } from '../controllers/cardsController';
import { getMovements, getContacts, transfer } from '../controllers/movementsController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/cards', authMiddleware, getCards);
router.get('/movements', authMiddleware, getMovements);
router.get('/contacts', authMiddleware, getContacts);
router.post('/transfer', authMiddleware, transfer);

export default router;
