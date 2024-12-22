'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { UserRole } from '@prisma/client';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  orgId: string | null;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
  } | null;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    status: {
      id: string;
      name: string;
      color: string;
    };
    createdAt: string;
  }>;
  contentShares: Array<{
    id: string;
    platform: string;
    clicks: number;
    engagements: number;
    createdAt: string;
    content: {
      title: string;
      points: number;
    };
  }>;
  drawingEntries: Array<{
    id: string;
    createdAt: string;
    drawing: {
      id: string;
      name: string;
      prize: string;
      drawDate: string;
    };
  }>;
  wonDrawings: Array<{
    id: string;
    createdAt: string;
    drawing: {
      id: string;
      name: string;
      prizeAmount: number;
      drawDate: string;
    };
  }>;
}

export default function UserProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedUser, setEditedUser] = useState<{
    name: string;
    email: string;
    role: UserRole;
  } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      setIsLoading(false);
      setError('Please sign in to view user profiles');
      return;
    }

    if (!session.user.role) {
      setIsLoading(false);
      setError('User role not found in session');
      return;
    }

    if (session.user.role !== UserRole.SUPER_ADMIN && !session.user.orgId) {
      setIsLoading(false);
      setError('Organization not found in session');
      return;
    }

    fetchUserProfile();
  }, [status, session, params.id]);

  useEffect(() => {
    if (user && !editedUser) {
      setEditedUser({
        name: user.name || '',
        email: user.email,
        role: user.role,
      });
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for ID:', params.id);
      console.log('Session:', {
        status,
        email: session?.user?.email,
        role: session?.user?.role,
        orgId: session?.user?.orgId,
        organization: session?.user?.organization
      });

      const response = await fetch(`/api/users/${params.id}`, {
        credentials: 'include',
      });

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });
      
      if (response.status === 401) {
        setError('Please sign in to view user profiles');
        return;
      }
      
      if (response.status === 403) {
        setError('You do not have permission to view this user profile');
        return;
      }
      
      if (response.status === 404) {
        setError('User profile not found');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch user profile');
      }

      const data = await response.json();
      console.log('API Response Data:', {
        id: data?.id,
        email: data?.email,
        role: data?.role,
        orgId: data?.orgId,
        organization: data?.organization?.name,
      });

      if (!data || typeof data !== 'object') {
        console.error('Invalid response data:', data);
        throw new Error('Invalid response data');
      }

      // Ensure all arrays are initialized
      const sanitizedData = {
        ...data,
        referrals: Array.isArray(data.referrals) ? data.referrals : [],
        contentShares: Array.isArray(data.contentShares) ? data.contentShares : [],
        drawingEntries: Array.isArray(data.drawingEntries) ? data.drawingEntries : [],
        wonDrawings: Array.isArray(data.wonDrawings) ? data.wonDrawings : []
      };
      
      setUser(sanitizedData);
      if (editedUser === null) {
        setEditedUser({
          name: sanitizedData.name || '',
          email: sanitizedData.email,
          role: sanitizedData.role
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      setError(error instanceof Error ? error.message : 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedUser) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/users/${params.id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedUser),
      });

      if (!response.ok) throw new Error('Failed to update user');

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/users/${params.id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      toast.success('User deleted successfully');
      router.push('/dashboard/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Loading user profile...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">{error}</h2>
        </div>
      </div>
    );
  }

  if (!user || !editedUser) return null;

  const canEdit = session?.user?.role === UserRole.SUPER_ADMIN || 
                 (session?.user?.role === UserRole.ADMIN && user.organization?.name === session?.user?.organization?.name);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* User Details Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>View and manage user details</CardDescription>
              </div>
              {canEdit && (
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="flex items-center"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div>
                <div className="mt-6 border-t border-gray-100">
                  <dl className="divide-y divide-gray-100">
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium leading-6 text-gray-900">Name</dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {isEditing ? (
                          <Input
                            value={editedUser.name || ''}
                            onChange={(e) =>
                              setEditedUser({ ...editedUser, name: e.target.value })
                            }
                          />
                        ) : (
                          user.name || 'Not set'
                        )}
                      </dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium leading-6 text-gray-900">Email</dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {isEditing ? (
                          <Input
                            value={editedUser.email}
                            onChange={(e) =>
                              setEditedUser({ ...editedUser, email: e.target.value })
                            }
                          />
                        ) : (
                          user.email
                        )}
                      </dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium leading-6 text-gray-900">Role</dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {isEditing ? (
                          <Select
                            value={editedUser.role}
                            onValueChange={(value: UserRole) =>
                              setEditedUser({ ...editedUser, role: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UserRole.USER}>User</SelectItem>
                              <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                              {session?.user?.role === UserRole.SUPER_ADMIN && (
                                <SelectItem value={UserRole.SUPER_ADMIN}>
                                  Super Admin
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          user.role
                        )}
                      </dd>
                    </div>
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm font-medium leading-6 text-gray-900">Organization</dt>
                      <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                        {user.organization?.name || 'No organization'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referrals Section */}
        {user.referrals && user.referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Referrals</CardTitle>
              <CardDescription>A list of referrals made by this user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <div className="flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {user.referrals.map((referral) => (
                            <tr key={referral.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{referral.name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{referral.email}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getStatusColor(referral.status.name)}`}>
                                  {referral.status.name}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drawing Entries Section */}
        {user.drawingEntries && user.drawingEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Drawing Entries</CardTitle>
              <CardDescription>A list of all drawings this user has entered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <div className="flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Drawing</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Prize</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Draw Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {user.drawingEntries.map((entry) => (
                            <tr key={entry.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{entry.drawing.name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${entry.drawing.prize}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {format(new Date(entry.drawing.drawDate), 'MMM d, yyyy')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Won Drawings Section */}
        {user.wonDrawings && user.wonDrawings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Won Drawings</CardTitle>
              <CardDescription>A list of all drawings this user has won</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <div className="flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Drawing</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Prize Amount</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Won On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {user.wonDrawings.map((win) => (
                            <tr key={win.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{win.drawing.name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${win.drawing.prizeAmount}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {format(new Date(win.createdAt), 'MMM d, yyyy')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Shares Section */}
        {user.contentShares && user.contentShares.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Content Shares</CardTitle>
              <CardDescription>A list of all content shared by this user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4">
                <div className="flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead>
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Content</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Platform</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Clicks</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Engagements</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Shared On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {user.contentShares.map((share) => (
                            <tr key={share.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{share.content.title}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{share.platform}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{share.clicks}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{share.engagements}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {format(new Date(share.createdAt), 'MMM d, yyyy')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string | undefined | null) {
  if (!status) {
    return 'bg-gray-100 text-gray-800';
  }
  
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'contacted':
      return 'bg-blue-100 text-blue-800';
    case 'qualified':
      return 'bg-purple-100 text-purple-800';
    case 'converted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
