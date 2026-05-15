import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CardAttributes {
  id: number;
  userId: number;
  issuer: string;
  name: string;
  expDate: string;
  lastDigits: number;
  balance: string;
  currency: string;
}

type CardCreationAttributes = Optional<CardAttributes, 'id'>;

export class Card
  extends Model<CardAttributes, CardCreationAttributes>
  implements CardAttributes
{
  declare id: number;
  declare userId: number;
  declare issuer: string;
  declare name: string;
  declare expDate: string;
  declare lastDigits: number;
  declare balance: string;
  declare currency: string;
}

Card.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    issuer: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    expDate: { type: DataTypes.STRING, allowNull: false },
    lastDigits: { type: DataTypes.INTEGER, allowNull: false },
    balance: { type: DataTypes.STRING, allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, modelName: 'Card' },
);

export default Card;
