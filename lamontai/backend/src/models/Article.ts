import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Article attributes interface
export interface ArticleAttributes {
  id: number;
  title: string;
  content: string;
  slug: string;
  summary: string;
  keywords: string[];
  metaTitle: string;
  metaDescription: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date | null;
  authorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Article creation attributes
export interface ArticleCreationAttributes extends Optional<ArticleAttributes, 'id' | 'slug' | 'summary' | 'metaTitle' | 'metaDescription' | 'status' | 'publishedAt' | 'createdAt' | 'updatedAt'> {}

// Article model class
class Article extends Model<ArticleAttributes, ArticleCreationAttributes> implements ArticleAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public slug!: string;
  public summary!: string;
  public keywords!: string[];
  public metaTitle!: string;
  public metaDescription!: string;
  public status!: 'draft' | 'published' | 'archived';
  public publishedAt!: Date | null;
  public authorId!: string;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Article model
Article.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    keywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    metaTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metaDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    authorId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
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
    modelName: 'Article',
    tableName: 'articles',
    timestamps: true,
    hooks: {
      beforeCreate: (article: Article) => {
        if (!article.slug && article.title) {
          // Generate slug from title
          article.slug = article.title
            .toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '-');
        }
        
        // Auto-generate meta title if not provided
        if (!article.metaTitle && article.title) {
          article.metaTitle = article.title;
        }
        
        // Auto-generate meta description if not provided
        if (!article.metaDescription && article.summary) {
          article.metaDescription = article.summary.substring(0, 160);
        }
      },
    },
  }
);

export default Article; 