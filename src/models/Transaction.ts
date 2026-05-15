import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TransactionType = 'SUS' | 'CASH_IN' | 'CASH_OUT';

export interface TransactionAttributes {
  id: number;
  userId: number;
  title: string;
  amount: string;
  transactionType: TransactionType;
  date: string;
}

type TransactionCreationAttributes = Optional<TransactionAttributes, 'id'>;

export class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare id: number;
  declare userId: number;
  declare title: string;
  declare amount: string;
  declare transactionType: TransactionType;
  declare date: string;
}

Transaction.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.STRING, allowNull: false },
    transactionType: {
      type: DataTypes.ENUM('SUS', 'CASH_IN', 'CASH_OUT'),
      allowNull: false,
    },
    date: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: 'Transaction' },
);

export default Transaction;
