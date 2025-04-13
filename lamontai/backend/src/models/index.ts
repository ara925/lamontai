import User from './User';
import Article from './Article';
import Subscription from './Subscription';
import UserSubscription from './UserSubscription';
import sequelize from '../config/database';

// Define associations between models
User.hasMany(Article, {
  sourceKey: 'id',
  foreignKey: 'authorId',
  as: 'articles'
});

Article.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author'
});

// User and Subscription associations via UserSubscription
User.belongsToMany(Subscription, {
  through: UserSubscription,
  foreignKey: 'userId',
  otherKey: 'subscriptionId',
  as: 'subscriptions'
});

Subscription.belongsToMany(User, {
  through: UserSubscription,
  foreignKey: 'subscriptionId',
  otherKey: 'userId',
  as: 'subscribers'
});

// User direct relationship with UserSubscription
User.hasMany(UserSubscription, {
  foreignKey: 'userId',
  as: 'userSubscriptions'
});

UserSubscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Subscription direct relationship with UserSubscription
Subscription.hasMany(UserSubscription, {
  foreignKey: 'subscriptionId',
  as: 'subscriptionUsers'
});

UserSubscription.belongsTo(Subscription, {
  foreignKey: 'subscriptionId',
  as: 'subscription'
});

// Sync models with database
export const syncDatabase = async (force = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
    throw error;
  }
};

export {
  User,
  Article,
  Subscription,
  UserSubscription,
  sequelize
}; 