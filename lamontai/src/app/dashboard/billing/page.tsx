'use client';

import React, { useState } from 'react';

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '0',
      features: [
        '1 article per day',
        'Basic SEO optimization',
        'Google Search Console integration',
        'Email support',
      ],
      isPopular: false,
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '29',
      features: [
        '5 articles per day',
        'Advanced SEO optimization',
        'All analytics integrations',
        'Content calendar',
        'Priority email support',
      ],
      isPopular: true,
    },
    {
      id: 'business',
      name: 'Business Plan',
      price: '99',
      features: [
        'Unlimited articles',
        'Enterprise-grade SEO',
        'Advanced analytics',
        'Custom templates',
        'API access',
        'Dedicated support',
      ],
      isPopular: false,
    },
  ];

  const invoices = [
    { id: 'INV-001', date: 'Apr 01, 2025', amount: '$29.00', status: 'Paid' },
    { id: 'INV-002', date: 'Mar 01, 2025', amount: '$29.00', status: 'Paid' },
    { id: 'INV-003', date: 'Feb 01, 2025', amount: '$29.00', status: 'Paid' },
    { id: 'INV-004', date: 'Jan 01, 2025', amount: '$29.00', status: 'Paid' },
  ];

  const handleChangePlan = (planId: string) => {
    setCurrentPlan(planId);
    setIsChangingPlan(false);
    // In a real app, you would call an API to update the subscription
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>

      {/* Current Subscription */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Current Subscription</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="text-lg font-medium">
              {plans.find(plan => plan.id === currentPlan)?.name}
            </div>
            <div className="text-sm text-gray-500">
              Renewal on May 1, 2025
            </div>
          </div>
          <div>
            <button
              onClick={() => setIsChangingPlan(true)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Change Plan
            </button>
          </div>
        </div>
      </div>

      {/* Change Plan Modal */}
      {isChangingPlan && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Change Subscription</h2>
            <button
              onClick={() => setIsChangingPlan(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-lg border ${
                  plan.isPopular
                    ? 'border-orange-500'
                    : plan.id === currentPlan
                    ? 'border-blue-500'
                    : 'border-gray-200'
                } p-6 shadow-sm transition-all hover:border-orange-300 hover:shadow-md`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white">
                    Popular
                  </div>
                )}
                {plan.id === currentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                    Current
                  </div>
                )}
                <div className="mb-4 text-lg font-bold">{plan.name}</div>
                <div className="mb-4 text-3xl font-bold">${plan.price}<span className="text-base font-normal text-gray-500">/mo</span></div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleChangePlan(plan.id)}
                  className={`w-full rounded-md ${
                    plan.id === currentPlan
                      ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                      : plan.isPopular
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } px-4 py-2 text-sm font-medium`}
                  disabled={plan.id === currentPlan}
                >
                  {plan.id === currentPlan ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Payment Method</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0 flex items-center">
            <div className="mr-3 h-10 w-16 rounded border bg-gray-50 p-2">
              <svg className="h-full w-full text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 4H2c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H2V6h20v12zM4 10h16v2H4z" />
              </svg>
            </div>
            <div>
              <div className="font-medium">Visa ending in 4242</div>
              <div className="text-sm text-gray-500">Expires 12/2028</div>
            </div>
          </div>
          <div>
            <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Billing History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b text-left text-sm font-medium text-gray-500">
                <th className="pb-3 pr-4">Invoice</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b text-sm">
                  <td className="py-4 pr-4 font-medium">{invoice.id}</td>
                  <td className="py-4 pr-4">{invoice.date}</td>
                  <td className="py-4 pr-4">{invoice.amount}</td>
                  <td className="py-4">
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 