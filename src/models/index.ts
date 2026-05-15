import sequelize from '../config/database';
import { User } from './User';
import { Card } from './Card';
import { Transaction } from './Transaction';

User.hasMany(Card, { foreignKey: 'userId' });
Card.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

export { sequelize, User, Card, Transaction };
