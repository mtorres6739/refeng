'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";

interface Organization {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: 'ADMIN' | 'CLIENT';
  points: number;
  organization: Organization;
}

export default function SettingsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const fetchUser = async () => {
    try {
      console.log('Fetching user data...');
      const response = await fetch('/api/user');
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Failed to fetch user data');
      }

      const data = await response.json();
      console.log('User data:', data);
      setUser(data);
      setFormData({
        ...formData,
        name: data.name || '',
        email: data.email || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data');
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      console.log('Session:', session);
      fetchUser();
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update user settings');
      }

      await fetchUser();
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {user && (
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Organization</p>
                <p className="font-medium">{user.organization.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Role</p>
                <p className="font-medium">{user.role}</p>
              </div>
              <div>
                <p className="text-gray-600">Points Balance</p>
                <p className="font-medium">{user.points}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
