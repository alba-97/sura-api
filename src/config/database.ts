import { Sequelize } from 'sequelize';

if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config({ quiet: true });
}

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
  },
);

export default sequelize;
