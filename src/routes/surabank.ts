import { Router } from 'express';
import { login } from '../controllers/authController';
import { getCards } from '../controllers/cardsController';
import { getLastMovements } from '../controllers/movementsController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/cards', authMiddleware, getCards);
router.get('/movements/last', authMiddleware, getLastMovements);

export default router;
