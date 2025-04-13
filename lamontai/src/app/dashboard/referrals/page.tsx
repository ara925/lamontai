import React from 'react';

export default function ReferralsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Earn Passive Income Through Our Partner Program</h1>
      </div>
      <p className="text-gray-700">
        Refer friends and earn up to 50% of the recurring revenue for each successful referral!
      </p>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Share the unique invitation link
          </label>
          <div className="flex">
            <input
              type="text"
              readOnly
              value="https://lamont.ai/sign-up?referral=ABC123XYZ"
              className="w-full rounded-l-md border border-gray-300 px-4 py-2 text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
            />
            <button className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-medium">Your Referrals</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-500">
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3">Signed up date</th>
                </tr>
              </thead>
              <tbody>
                {/* Sample referral rows */}
                <tr className="border-b">
                  <td className="py-4 pr-4 text-sm">user1@example.com</td>
                  <td className="py-4 text-sm">April 1, 2025</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 pr-4 text-sm">user2@example.com</td>
                  <td className="py-4 text-sm">April 3, 2025</td>
                </tr>
                <tr>
                  <td className="py-4 pr-4 text-sm">user3@example.com</td>
                  <td className="py-4 text-sm">April 5, 2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">How it works</h2>
          <div className="space-y-4">
            <div className="flex">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                1
              </div>
              <div>
                <h3 className="font-medium">Share your referral link</h3>
                <p className="text-sm text-gray-600">
                  Send your unique referral link to friends, colleagues, or share it on social media.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                2
              </div>
              <div>
                <h3 className="font-medium">They sign up</h3>
                <p className="text-sm text-gray-600">
                  When someone uses your link to sign up and becomes a paying customer, you'll get credit for the referral.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                3
              </div>
              <div>
                <h3 className="font-medium">You earn commission</h3>
                <p className="text-sm text-gray-600">
                  You'll earn 50% of their recurring subscription fee for as long as they remain a customer!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Commission overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-500">
                  <th className="pb-3 pr-4">Referral</th>
                  <th className="pb-3 pr-4">Plan</th>
                  <th className="pb-3 pr-4">Commission</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 pr-4 text-sm">user1@example.com</td>
                  <td className="py-4 pr-4 text-sm">Scale ($299/mo)</td>
                  <td className="py-4 pr-4 text-sm font-medium text-green-600">$149.50/mo</td>
                  <td className="py-4 text-sm">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 pr-4 text-sm">user2@example.com</td>
                  <td className="py-4 pr-4 text-sm">Scale ($299/mo)</td>
                  <td className="py-4 pr-4 text-sm font-medium text-green-600">$149.50/mo</td>
                  <td className="py-4 text-sm">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 pr-4 text-sm">user3@example.com</td>
                  <td className="py-4 pr-4 text-sm">Scale ($299/mo)</td>
                  <td className="py-4 pr-4 text-sm font-medium text-gray-600">$0.00/mo</td>
                  <td className="py-4 text-sm">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                      Trial
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 