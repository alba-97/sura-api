import sequelize from '../config/database';
import { User } from './User';
import { Card } from './Card';
import { Transaction } from './Transaction';
import { UserContact } from './UserContact';

User.hasMany(Card, { foreignKey: 'userId' });
Card.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.belongsToMany(User, {
  through: UserContact,
  as: 'contacts',
  foreignKey: 'userId',
  otherKey: 'contactId',
});

export { sequelize, User, Card, Transaction, UserContact };
