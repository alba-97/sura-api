import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { sequelize, User, Card, Transaction } from './src/models';
import surabankRoutes from './src/routes/surabank';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/surabank', surabankRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const start = async (): Promise<void> => {
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`SuraBank API running on port ${PORT}`);
  });
};

if (require.main === module) {
  start();
}

export default app;
