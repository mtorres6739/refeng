'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalContent: number;
  totalShares: number;
  totalClicks: number;
  totalEngagements: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalContent: 0,
    totalShares: 0,
    totalClicks: 0,
    totalEngagements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  if (!session) {
    return <div className="p-4">Please sign in to view your dashboard.</div>;
  }

  if (loading) {
    return <div className="p-4">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome back, {session.user.name}!</h1>
      <p className="text-gray-600 mb-8">Here's an overview of your content sharing activity</p>

      <div className="flex gap-4 mb-8">
        <Link href="/dashboard/content">
          <Button>
            View Content
          </Button>
        </Link>
        <Link href="/dashboard/shares">
          <Button variant="outline">
            View Shares
          </Button>
        </Link>
        <Link href="/dashboard/referrals/new">
          <Button variant="outline">
            New Referral
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Content</h3>
          <p className="text-3xl font-bold">{stats.totalContent}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Shares</h3>
          <p className="text-3xl font-bold">{stats.totalShares}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Clicks</h3>
          <p className="text-3xl font-bold">{stats.totalClicks}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Engagements</h3>
          <p className="text-3xl font-bold">{stats.totalEngagements}</p>
        </div>
      </div>
    </div>
  );
}
