'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

interface ReferralDetails {
  programName: string;
  referrerName: string;
  incentives: {
    name: string;
    description: string;
    type: string;
    value: number;
  }[];
}

export default function ReferralPage({
  params,
}: {
  params: { code: string };
}) {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [referralDetails, setReferralDetails] = useState<ReferralDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const programId = searchParams.get('p');
  const referrerId = searchParams.get('u');

  useEffect(() => {
    const trackReferralClick = async () => {
      try {
        // Track the click
        await fetch('/api/referral/track-click', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referralCode: params.code,
            programId,
            referrerId,
          }),
        });

        // Fetch referral details
        const response = await fetch(`/api/referral/${params.code}?programId=${programId}&referrerId=${referrerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch referral details');
        }
        const data = await response.json();
        setReferralDetails(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load referral details');
      } finally {
        setLoading(false);
      }
    };

    if (programId && referrerId) {
      trackReferralClick();
    }
  }, [params.code, programId, referrerId]);

  const handleSignUp = async () => {
    // Store referral info in localStorage before redirecting
    if (params.code && programId && referrerId) {
      localStorage.setItem('referralInfo', JSON.stringify({
        code: params.code,
        programId,
        referrerId,
      }));
    }
    await signIn(undefined, { callbackUrl: '/dashboard' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!referralDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Referral Link</h1>
          <p className="text-gray-600">This referral link appears to be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              You've Been Referred!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {referralDetails.referrerName} has invited you to join {referralDetails.programName}
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Rewards</h3>
              <div className="space-y-4">
                {referralDetails.incentives.map((incentive, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        {incentive.name}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {incentive.description}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {incentive.type === 'POINTS'
                          ? `${incentive.value} Points`
                          : incentive.type === 'CASH'
                          ? `$${incentive.value}`
                          : `${incentive.value} ${incentive.type}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!session ? (
              <div className="space-y-4">
                <button
                  onClick={handleSignUp}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign Up Now
                </button>
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => signIn(undefined, { callbackUrl: '/dashboard' })}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-600">
                You're already signed in!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
