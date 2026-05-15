import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface NotificationAttributes {
  id: number;
  userId: number;
  message: string;
  read: boolean;
  createdAt?: Date;
}

type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'read' | 'createdAt'
>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare userId: number;
  declare message: string;
  declare read: boolean;
  declare createdAt: Date;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'Notification', timestamps: true, updatedAt: false },
);

export default Notification;
