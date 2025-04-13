'use client';

import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard title="Total Page Views" value="12,345" change="+15%" positive />
        <MetricCard title="Unique Visitors" value="3,721" change="+8%" positive />
        <MetricCard title="Bounce Rate" value="32%" change="-5%" positive />
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Traffic Overview</h2>
        <div className="h-64 w-full bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Chart will appear here</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Top Pages</h2>
          <div className="space-y-2">
            <TableRow page="/homepage" views="3,421" />
            <TableRow page="/features" views="1,983" />
            <TableRow page="/pricing" views="1,758" />
            <TableRow page="/blog/seo-tips" views="1,221" />
            <TableRow page="/about" views="987" />
          </div>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Traffic Sources</h2>
          <div className="space-y-2">
            <TableRow page="Google" views="6,521" />
            <TableRow page="Direct" views="2,983" />
            <TableRow page="Twitter" views="1,358" />
            <TableRow page="Facebook" views="985" />
            <TableRow page="LinkedIn" views="724" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
}

function MetricCard({ title, value, change, positive }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className={`mt-1 inline-flex items-center text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {change}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`ml-1 h-4 w-4 ${positive ? 'rotate-0' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </div>
    </div>
  );
}

interface TableRowProps {
  page: string;
  views: string;
}

function TableRow({ page, views }: TableRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
      <div className="font-medium">{page}</div>
      <div className="text-gray-500">{views}</div>
    </div>
  );
} 