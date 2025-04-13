'use client';

import React from 'react';
import { getAllArticles } from '@/lib/articles';

export default function ContentPlanPage() {
  const articles = getAllArticles();
  
  // Get current month calendar days (simplified)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Create calendar days array with padding for first day
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null); // Empty cells for days before the 1st
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }
  
  // Get month name
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content Plan</h1>
        <button className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
          Create Content
        </button>
      </div>

      {/* Calendar */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{monthName} {currentYear}</h2>
          <div className="flex space-x-2">
            <button className="rounded-md border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="rounded-md border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="mb-6 grid grid-cols-7 gap-2 border-b pb-4 text-center text-sm font-medium text-gray-500">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`h-24 rounded-md border p-2 ${
                day === null
                  ? 'bg-gray-50'
                  : day === new Date().getDate() && currentMonth === new Date().getMonth()
                  ? 'border-orange-300 bg-orange-50'
                  : 'hover:border-gray-300'
              }`}
            >
              {day !== null && (
                <>
                  <div className="text-right text-sm font-medium">{day}</div>
                  {day === 5 && currentMonth === 3 && (
                    <div className="mt-2 rounded bg-orange-100 p-1 text-xs text-orange-800">
                      Article ready
                    </div>
                  )}
                  {day === 12 && (
                    <div className="mt-2 rounded bg-blue-100 p-1 text-xs text-blue-800">
                      Draft due
                    </div>
                  )}
                  {day === 20 && (
                    <div className="mt-2 rounded bg-purple-100 p-1 text-xs text-purple-800">
                      Keyword research
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Content */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Upcoming Content</h2>
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
              <div>
                <h3 className="font-medium">{article.title}</h3>
                <div className="mt-1 text-sm text-gray-500">{article.date}</div>
              </div>
              <div className="flex space-x-2">
                <button className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Edit
                </button>
                <button className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 