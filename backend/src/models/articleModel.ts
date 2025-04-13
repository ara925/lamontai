import mongoose from 'mongoose';

export interface IArticle extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  title: string;
  snippet: string;
  content: string;
  keywords: string[];
  status: 'draft' | 'published' | 'archived';
  wordCount: number;
  seoScore: number;
  readabilityScore: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  tags?: string[];
  category?: string;
  slug?: string;
}

const articleSchema = new mongoose.Schema<IArticle>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    snippet: {
      type: String,
      required: [true, 'Please add a snippet'],
      trim: true,
      maxlength: [300, 'Snippet cannot be more than 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
      minlength: [50, 'Content must be at least 50 characters'],
    },
    keywords: {
      type: [String],
      required: [true, 'Please add at least one keyword'],
      validate: {
        validator: function(v: string[]) {
          return v.length > 0;
        },
        message: 'Please add at least one keyword',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    wordCount: {
      type: Number,
      required: true,
      min: [0, 'Word count cannot be negative'],
    },
    seoScore: {
      type: Number,
      min: [0, 'SEO score must be between 0 and 100'],
      max: [100, 'SEO score must be between 0 and 100'],
      default: 0,
    },
    readabilityScore: {
      type: Number,
      min: [0, 'Readability score must be between 0 and 100'],
      max: [100, 'Readability score must be between 0 and 100'],
      default: 0,
    },
    publishedAt: {
      type: Date,
    },
    tags: {
      type: [String],
    },
    category: {
      type: String,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true, // Allow null values to be unique
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from title
articleSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  next();
});

// Calculate word count from content
articleSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.wordCount = this.content.split(/\s+/).length;
  }
  next();
});

// Set published date when article is published
articleSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const Article = mongoose.model<IArticle>('Article', articleSchema);

export default Article; 