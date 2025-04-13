import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// UserSubscription attributes interface
export interface UserSubscriptionAttributes {
  id: number;
  userId: number;
  subscriptionId: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'canceled' | 'expired' | 'pending';
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  paymentId: string;
  autoRenew: boolean;
  articlesGenerated: number;
  nextBillingDate: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for UserSubscription creation attributes
export interface UserSubscriptionCreationAttributes extends Optional<UserSubscriptionAttributes, 
  'id' | 'status' | 'paymentStatus' | 'paymentMethod' | 'paymentId' | 'autoRenew' | 'articlesGenerated' | 'nextBillingDate' | 'createdAt' | 'updatedAt'> {}

// UserSubscription model class
class UserSubscription extends Model<UserSubscriptionAttributes, UserSubscriptionCreationAttributes> implements UserSubscriptionAttributes {
  public id!: number;
  public userId!: number;
  public subscriptionId!: number;
  public startDate!: Date;
  public endDate!: Date;
  public status!: 'active' | 'canceled' | 'expired' | 'pending';
  public paymentStatus!: 'paid' | 'pending' | 'failed';
  public paymentMethod!: string;
  public paymentId!: string;
  public autoRenew!: boolean;
  public articlesGenerated!: number;
  public nextBillingDate!: Date | null;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize UserSubscription model
UserSubscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'canceled', 'expired', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentStatus: {
      type: DataTypes.ENUM('paid', 'pending', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    articlesGenerated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'UserSubscription',
    tableName: 'user_subscriptions',
    timestamps: true,
  }
);

export default UserSubscription; 