import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  name: string;
  balance: string;
  token?: string | null;
}

type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'token' | 'balance'
>;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare email: string;
  declare password: string;
  declare name: string;
  declare balance: string;
  declare token: string | null;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.STRING, allowNull: false, defaultValue: '0.00' },
    token: { type: DataTypes.STRING },
  },
  { sequelize, modelName: 'User' },
);

export default User;
