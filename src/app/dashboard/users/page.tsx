'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  points: number;
  org: {
    name: string;
  };
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  orgId?: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: UserRole.CLIENT,
  });

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (!session?.user) {
      setIsLoading(false);
      setError('Please sign in to view users');
      return;
    }

    fetchUsers();
    if (session.user.role === UserRole.SUPER_ADMIN) {
      fetchOrganizations();
    }
  }, [session, status]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users with session:', {
        email: session?.user?.email,
        role: session?.user?.role,
        orgId: session?.user?.orgId,
      });

      const response = await fetch('/api/users');
      
      if (response.status === 401) {
        setError('Please sign in to view users');
        return;
      }
      
      if (response.status === 403) {
        setError('You do not have permission to view users');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.log('Users data:', {
        count: data.length,
        firstUser: data[0]?.id,
      });
      
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      await fetchUsers();
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: UserRole.CLIENT,
      });
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link href="/dashboard/users/create">
          <Button>
            Add User
          </Button>
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Email
              </th>
              {session?.user?.role === UserRole.SUPER_ADMIN && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Organization
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Points
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/dashboard/users/${user.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-900"
                  >
                    {user.name || 'No name'}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                {session?.user?.role === UserRole.SUPER_ADMIN && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.org?.name}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsCreateModalOpen(false)} />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Add New User</h3>
                  <div className="mt-2">
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <select
                          id="role"
                          name="role"
                          required
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value={UserRole.CLIENT}>Client</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                        </select>
                      </div>

                      {session?.user?.role === UserRole.SUPER_ADMIN && (
                        <div>
                          <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                            Organization
                          </label>
                          <select
                            id="organization"
                            name="organization"
                            value={formData.orgId || ''}
                            onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="">Select an organization</option>
                            {organizations.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <Button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                          Add User
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setIsCreateModalOpen(false)}
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
