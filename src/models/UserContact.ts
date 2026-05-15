import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface UserContactAttributes {
  userId: number;
  contactId: number;
}

export class UserContact
  extends Model<UserContactAttributes>
  implements UserContactAttributes
{
  declare userId: number;
  declare contactId: number;
}

UserContact.init(
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    contactId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  },
  { sequelize, modelName: 'UserContact', timestamps: true },
);

export default UserContact;
