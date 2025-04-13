'use client';

import React from 'react';
import Link from 'next/link';
import { getArticleById } from '@/lib/articles';
import { ArrowLeft } from 'lucide-react';

interface ArticlePageProps {
  params: {
    id: string;
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticleById(params.id);

  if (!article) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link 
            href="/dashboard" 
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </Link>
          <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Article Not Found</h1>
            <p>The article you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link 
          href="/dashboard" 
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="border-b pb-4">
            <div className="mb-2 text-sm text-gray-500">{article.date} • {article.category}</div>
            <h1 className="text-3xl font-bold">{article.title}</h1>
          </div>
          
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div className="space-y-1">
              <div className="text-xs text-gray-500">SEO IMPACT</div>
              <div className="text-xl font-bold">{article.seoImpact}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500">KEYWORDS</div>
              <div className="text-xl font-bold">{article.keywords}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500">SEARCH VOLUME</div>
              <div className="text-xl font-bold">{article.searchVolume.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </div>
    </div>
  );
} 