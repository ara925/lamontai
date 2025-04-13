import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Subscription Plan attributes interface
export interface SubscriptionAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  articleLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Subscription creation attributes
export interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

// Subscription model class
class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public billingCycle!: 'monthly' | 'yearly';
  public features!: string[];
  public isActive!: boolean;
  public articleLimit!: number;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Subscription model
Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'yearly'),
      allowNull: false,
      defaultValue: 'monthly',
    },
    features: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    articleLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
  }
);

export default Subscription; 