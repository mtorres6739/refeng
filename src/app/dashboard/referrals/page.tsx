'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { UserRole } from '@prisma/client';

interface Referral {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: {
    id: string;
    name: string;
    color: string;
    description: string;
    order: number;
    isDefault: boolean;
  };
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
  };
  organization: {
    name: string;
  };
}

export default function ReferralsPage() {
  const { data: session, status } = useSession();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<Referral['status']['name'] | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'createdAt' | 'status'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.user) {
      setIsLoading(false);
      setError('Please sign in to view referrals');
      return;
    }

    fetchReferrals();
  }, [session, status]);

  const fetchReferrals = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Fetching referrals with session:', {
        id: session?.user?.id,
        role: session?.user?.role,
        orgId: session?.user?.orgId,
      });
      
      const response = await fetch('/api/referrals');
      
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        setError('Please sign in to view referrals');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch referrals');
      }
      
      const data = await response.json();
      console.log('Referrals data:', {
        count: data.length,
        firstReferral: data[0]?.id,
      });
      
      setReferrals(data);
    } catch (error) {
      console.error('Error in fetchReferrals:', error);
      setError(error instanceof Error ? error.message : 'Failed to load referrals');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return <div className="p-4">Please sign in to view referrals.</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading referrals...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  const filteredReferrals = referrals
    .filter(referral => statusFilter === 'ALL' || referral.status.name === statusFilter)
    .sort((a, b) => {
      if (sortField === 'createdAt') {
        return sortDirection === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return sortDirection === 'asc'
          ? a.status.order - b.status.order
          : b.status.order - a.status.order;
      }
    });

  const uniqueStatuses = Array.from(new Set(referrals.map(r => r.status.name)));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <Link href="/dashboard/referrals/new">
          <Button>
            New Referral
          </Button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex gap-4 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="border rounded p-2"
            >
              <option value="ALL">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'createdAt' | 'status')}
              className="border rounded p-2"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>

            <button
              onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
              className="p-2 border rounded"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                {session.user.role === UserRole.SUPER_ADMIN && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/dashboard/referrals/${referral.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {referral.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{referral.email}</div>
                    {referral.phone && (
                      <div className="text-sm text-gray-500">{referral.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      style={{ backgroundColor: referral.status.color + '40', color: referral.status.color }}
                    >
                      {referral.status.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                  </td>
                  {session.user.role === UserRole.SUPER_ADMIN && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {referral.organization.name}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
